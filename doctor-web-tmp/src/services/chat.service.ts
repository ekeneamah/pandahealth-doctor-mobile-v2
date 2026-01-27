import apiClient from '@/lib/api-client';
import type { 
  ApiResponse, 
  ChatMessage, 
  ChatThread, 
  ChatMessagesResponse, 
  SendMessageRequest,
  UnreadCountResponse,
  UploadChatFileRequest,
  ChatFileUploadResponse
} from '@/types';

export const chatService = {
  /**
   * Get messages for a case
   */
  async getMessages(caseId: string, limit: number = 50, beforeMessageId?: string): Promise<ChatMessagesResponse> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (beforeMessageId) {
      params.append('beforeMessageId', beforeMessageId);
    }
    const response = await apiClient.get<ApiResponse<ChatMessagesResponse>>(
      `/chat/cases/${caseId}/messages?${params.toString()}`
    );
    return response.data.data;
  },

  /**
   * Send a message in a case chat
   */
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    const response = await apiClient.post<ApiResponse<ChatMessage>>('/chat/messages', request);
    return response.data.data;
  },

  /**
   * Upload a file in chat (base64)
   */
  async uploadFile(request: UploadChatFileRequest): Promise<ChatFileUploadResponse> {
    const response = await apiClient.post<ApiResponse<ChatFileUploadResponse>>('/chat/upload', request);
    return response.data.data;
  },

  /**
   * Upload a file using FormData (for larger files)
   */
  async uploadFileForm(caseId: string, file: File, caption?: string): Promise<ChatFileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }
    const response = await apiClient.post<ApiResponse<ChatFileUploadResponse>>(
      `/chat/cases/${caseId}/upload`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  /**
   * Mark messages as read for a case
   */
  async markAsRead(caseId: string): Promise<void> {
    await apiClient.post(`/chat/cases/${caseId}/read`);
  },

  /**
   * Get all chat threads
   */
  async getThreads(): Promise<ChatThread[]> {
    const response = await apiClient.get<ApiResponse<ChatThread[]>>('/chat/threads');
    return response.data.data;
  },

  /**
   * Get unread message counts
   */
  async getUnreadCounts(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<ApiResponse<UnreadCountResponse>>('/chat/unread');
    return response.data.data;
  },

  /**
   * Initialize chat for a case (doctor only)
   */
  async initializeChat(caseId: string): Promise<ChatThread> {
    const response = await apiClient.post<ApiResponse<ChatThread>>(`/chat/cases/${caseId}/initialize`);
    return response.data.data;
  },
};

export default chatService;
