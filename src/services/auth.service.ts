import apiClient from '@/src/lib/api-client';
import type { ApiResponse, LoginRequest, LoginResponse, User } from '@/src/types';

const logAuth = (action: string, data: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[AuthService ${timestamp}] ${action}:`, JSON.stringify(data, null, 2));
};

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      logAuth('LOGIN_START', {
        email: credentials.email,
        hasPassword: !!credentials.password,
        deviceFingerprint: credentials.deviceFingerprint,
      });

      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
      
      logAuth('LOGIN_SUCCESS', {
        status: response.status,
        success: response.data.success,
        hasData: !!response.data.data,
        userId: response.data.data?.userId,
        email: response.data.data?.email,
        role: response.data.data?.role,
        hasToken: !!response.data.data?.idToken,
        hasRefreshToken: !!response.data.data?.refreshToken,
        hasSessionId: !!response.data.data?.sessionId,
        tokenLength: response.data.data?.idToken?.length,
      });

      return response.data.data!;
    } catch (error) {
      logAuth('LOGIN_ERROR', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },

  async getProfile(): Promise<User> {
    try {
      logAuth('GET_PROFILE_START', {});
      const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
      
      logAuth('GET_PROFILE_SUCCESS', {
        userId: response.data.data?.id,
        email: response.data.data?.email,
        role: response.data.data?.role,
      });

      return response.data.data!;
    } catch (error) {
      logAuth('GET_PROFILE_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      logAuth('LOGOUT_START', {});
      await apiClient.post('/auth/logout');
      logAuth('LOGOUT_SUCCESS', {});
    } catch (error) {
      logAuth('LOGOUT_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      logAuth('REFRESH_TOKEN_START', {
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken.length,
      });

      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh', { refreshToken });
      
      logAuth('REFRESH_TOKEN_SUCCESS', {
        hasNewToken: !!response.data.data?.idToken,
        hasNewRefreshToken: !!response.data.data?.refreshToken,
        newTokenLength: response.data.data?.idToken?.length,
      });

      return response.data.data!;
    } catch (error) {
      logAuth('REFRESH_TOKEN_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      logAuth('CHANGE_PASSWORD_START', {
        hasCurrentPassword: !!currentPassword,
        hasNewPassword: !!newPassword,
      });

      await apiClient.post<ApiResponse<void>>('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      logAuth('CHANGE_PASSWORD_SUCCESS', {});
    } catch (error) {
      logAuth('CHANGE_PASSWORD_ERROR', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
};

export default authService;
