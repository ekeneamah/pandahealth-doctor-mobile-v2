import { API_BASE_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getDeviceFingerprint } from './device';

// Import auth store for handling 401 errors
let authStore: any = null;

// Initialize auth store reference
export const setAuthStoreRef = (store: any) => {
  authStore = store;
};

// Enhanced logging utility
const logApiCall = (stage: string, data: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[API Client ${timestamp}] ${stage}:`, JSON.stringify(data, null, 2));
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - adds auth token and session ID
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const requestId = Math.random().toString(36).substring(7);
    config.headers['X-Request-Id'] = requestId;
    
    logApiCall('REQUEST', {
      requestId,
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullUrl: `${config.baseURL}${config.url}`,
      headers: {
        'Content-Type': config.headers['Content-Type'],
      },
      params: config.params,
      data: config.data,
    });
    
    const token = await AsyncStorage.getItem('doctor-auth-storage');
    
    if (token) {
      try {
        const authData = JSON.parse(token);
        const { state } = authData;
        
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
          logApiCall('AUTH', {
            requestId,
            tokenLength: state.token.length,
            tokenPrefix: state.token.substring(0, 20) + '...',
          });
        }
        
        if (state?.sessionId) {
          config.headers['X-Session-Id'] = state.sessionId;
          logApiCall('SESSION', {
            requestId,
            sessionId: state.sessionId,
          });
        }

        if (state?.user) {
          logApiCall('USER', {
            requestId,
            userId: state.user.id,
            email: state.user.email,
            role: state.user.role,
          });
        }
      } catch (error) {
        logApiCall('AUTH_ERROR', {
          requestId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      logApiCall('NO_AUTH', {
        requestId,
        message: 'No auth token found in storage',
      });
    }
    
    // Add device fingerprint
    const fingerprint = await getDeviceFingerprint();
    config.headers['X-Device-Fingerprint'] = fingerprint;
    logApiCall('DEVICE', {
      requestId,
      fingerprint,
    });
    
    return config;
  },
  (error: unknown) => {
    logApiCall('REQUEST_ERROR', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors
apiClient.interceptors.response.use(
  (response) => {
    const requestId = response.config.headers['X-Request-Id'];
    const duration = response.config.metadata?.startTime 
      ? Date.now() - response.config.metadata.startTime 
      : undefined;

    logApiCall('RESPONSE_SUCCESS', {
      requestId,
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      duration: duration ? `${duration}ms` : 'N/A',
      dataSize: JSON.stringify(response.data).length,
      data: response.data,
    });
    return response;
  },
  async (error: AxiosError) => {
    const requestId = error.config?.headers['X-Request-Id'];
    const duration = error.config?.metadata?.startTime 
      ? Date.now() - error.config.metadata.startTime 
      : undefined;

    logApiCall('RESPONSE_ERROR', {
      requestId,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      duration: duration ? `${duration}ms` : 'N/A',
      errorMessage: error.message,
      responseData: error.response?.data,
      headers: error.response?.headers,
    });
    
    if (error.response?.status === 401) {
      logApiCall('UNAUTHORIZED', {
        requestId,
        url: error.config?.url,
        action: 'Clearing auth storage and logging out user',
      });
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('doctor-auth-storage');
      
      // Update auth store to trigger logout
      if (authStore) {
        authStore.logout();
      }
    }

    if (error.response?.status === 403) {
      logApiCall('FORBIDDEN', {
        requestId,
        url: error.config?.url,
        message: 'Access denied',
      });
    }

    if (error.response?.status === 500) {
      logApiCall('SERVER_ERROR', {
        requestId,
        url: error.config?.url,
        message: 'Internal server error',
      });
    }

    if (error.code === 'ECONNABORTED') {
      logApiCall('TIMEOUT', {
        requestId,
        url: error.config?.url,
        timeout: error.config?.timeout,
      });
    }

    if (!error.response) {
      logApiCall('NETWORK_ERROR', {
        requestId,
        message: 'No response received from server',
        errorCode: error.code,
      });
    }
    
    return Promise.reject(error);
  }
);

// Add request start time
apiClient.interceptors.request.use(
  (config: any) => {
    config.metadata = { startTime: Date.now() };
    return config;
  }
);

export default apiClient;

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string; errors?: string[] }>;
    
    logApiCall('ERROR_PARSING', {
      hasResponse: !!axiosError.response,
      status: axiosError.response?.status,
      responseData: axiosError.response?.data,
    });

    // Handle backend ApiResponse error format
    if (axiosError.response?.data?.errors && Array.isArray(axiosError.response.data.errors)) {
      return axiosError.response.data.errors.join(', ');
    }
    
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      'An unexpected error occurred'
    );
  }
  
  if (error instanceof Error) {
    logApiCall('ERROR_GENERIC', {
      message: error.message,
      stack: error.stack,
    });
    return error.message;
  }
  
  logApiCall('ERROR_UNKNOWN', {
    error: String(error),
  });
  
  return 'An unexpected error occurred';
}
