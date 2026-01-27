import { API_BASE_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getDeviceFingerprint } from './device';

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
    console.log('[API Client] Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
    });
    
    const token = await AsyncStorage.getItem('doctor-auth-storage');
    
    if (token) {
      try {
        const authData = JSON.parse(token);
        const { state } = authData;
        
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
          console.log('[API Client] Added auth token');
        }
        
        if (state?.sessionId) {
          config.headers['X-Session-Id'] = state.sessionId;
          console.log('[API Client] Added session ID');
        }
      } catch (error) {
        console.error('[API Client] Failed to parse auth token:', error);
      }
    }
    
    // Add device fingerprint
    const fingerprint = await getDeviceFingerprint();
    config.headers['X-Device-Fingerprint'] = fingerprint;
    console.log('[API Client] Added device fingerprint:', fingerprint);
    
    return config;
  },
  (error: unknown) => {
    console.error('[API Client] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API Client] Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
    });
    return response;
  },
  async (error: AxiosError) => {
    console.error('[API Client] Response error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
    });
    
    if (error.response?.status === 401) {
      console.log('[API Client] 401 Unauthorized - clearing auth storage');
      await AsyncStorage.removeItem('doctor-auth-storage');
      // Router navigation will be handled by the auth store listener
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string; errors?: string[] }>;
    
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
    return error.message;
  }
  
  return 'An unexpected error occurred';
}
