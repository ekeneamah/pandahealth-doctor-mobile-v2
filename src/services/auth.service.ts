import apiClient from '@/src/lib/api-client';
import type { ApiResponse, LoginRequest, LoginResponse, User } from '@/src/types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('[AuthService] Login attempt:', { email: credentials.email });
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    console.log('[AuthService] Login response:', {
      status: response.status,
      success: response.data.success,
      hasData: !!response.data.data,
    });
    return response.data.data!;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile');
    return response.data.data!;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh', { refreshToken });
    return response.data.data!;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
};

export default authService;
