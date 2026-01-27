import apiClient from '@/src/lib/api-client';
import type { ApiResponse, ChatMessage, ChatThread, SendMessageRequest } from '@/src/types';

interface ChatMessagesResponse {
  caseId: string;
  caseNumber: string;
  thread?: ChatThread;
  messages: ChatMessage[];
  hasMore: boolean;
}

export const chatService = {
  async getMessages(caseId: string, limit: number = 50): Promise<ChatMessagesResponse> {
    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await apiClient.get<ApiResponse<ChatMessagesResponse>>(
      `/chat/cases/${caseId}/messages?${params}`
    );
    return response.data.data;
  },

  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    const response = await apiClient.post<ApiResponse<ChatMessage>>('/chat/messages', request);
    return response.data.data;
  },

  async markAsRead(caseId: string): Promise<void> {
    await apiClient.post(`/chat/cases/${caseId}/read`);
  },

  async getThreads(): Promise<ChatThread[]> {
    const response = await apiClient.get<ApiResponse<ChatThread[]>>('/chat/threads');
    return response.data.data;
  },

  async getUnreadCounts(): Promise<{ totalUnreadCount: number; unreadByCaseId: Record<string, number> }> {
    const response = await apiClient.get<ApiResponse<{ totalUnreadCount: number; unreadByCaseId: Record<string, number> }>>('/chat/unread');
    return response.data.data;
  },
};

export default chatService;
