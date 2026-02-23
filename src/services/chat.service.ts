import apiClient from '@/src/lib/api-client';
import type { ApiResponse, ChatMessage, ChatThread, SendMessageRequest } from '@/src/types';

interface ChatMessagesResponse {
  caseId: string;
  caseNumber: string;
  thread?: ChatThread;
  messages: ChatMessage[];
  hasMore: boolean;
}

function logChat(action: string, data?: any) {
  console.log(`[Chat Service ${new Date().toISOString()}] ${action}:`, data);
}

export const chatService = {
  async getMessages(caseId: string, limit: number = 50): Promise<ChatMessagesResponse> {
    logChat('REQUEST: Get messages', { caseId, limit });
    const startTime = Date.now();
    
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      const response = await apiClient.get<ApiResponse<ChatMessagesResponse>>(
        `/chat/cases/${caseId}/messages?${params}`
      );
      
      const duration = Date.now() - startTime;
      logChat('RESPONSE: Get messages', {
        caseId,
        messageCount: response.data.data.messages.length,
        hasMore: response.data.data.hasMore,
        duration: `${duration}ms`,
      });
      
      return response.data.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logChat('ERROR: Get messages', {
        caseId,
        error: error.message,
        status: error.response?.status,
        duration: `${duration}ms`,
      });
      throw error;
    }
  },

  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    logChat('REQUEST: Send message', {
      caseId: request.caseId,
      messageLength: request.message.length,
      messageType: request.messageType || 'Text',
    });
    const startTime = Date.now();
    
    try {
      const response = await apiClient.post<ApiResponse<ChatMessage>>('/chat/messages', request);
      
      const duration = Date.now() - startTime;
      logChat('RESPONSE: Send message', {
        caseId: request.caseId,
        messageId: response.data.data.id,
        duration: `${duration}ms`,
      });
      
      return response.data.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logChat('ERROR: Send message', {
        caseId: request.caseId,
        error: error.message,
        status: error.response?.status,
        duration: `${duration}ms`,
      });
      throw error;
    }
  },

  async markAsRead(caseId: string): Promise<void> {
    logChat('REQUEST: Mark as read', { caseId });
    const startTime = Date.now();
    
    try {
      await apiClient.post(`/chat/cases/${caseId}/read`);
      
      const duration = Date.now() - startTime;
      logChat('RESPONSE: Mark as read', {
        caseId,
        duration: `${duration}ms`,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logChat('ERROR: Mark as read', {
        caseId,
        error: error.message,
        status: error.response?.status,
        duration: `${duration}ms`,
      });
      throw error;
    }
  },

  async getThreads(): Promise<ChatThread[]> {
    logChat('REQUEST: Get threads', {});
    const startTime = Date.now();
    
    try {
      const response = await apiClient.get<ApiResponse<ChatThread[]>>('/chat/threads');
      
      const duration = Date.now() - startTime;
      logChat('RESPONSE: Get threads', {
        threadCount: response.data.data.length,
        unreadThreads: response.data.data.filter((t) => t.unreadCount > 0).length,
        duration: `${duration}ms`,
      });
      
      return response.data.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logChat('ERROR: Get threads', {
        error: error.message,
        status: error.response?.status,
        duration: `${duration}ms`,
      });
      throw error;
    }
  },

  async getUnreadCounts(): Promise<{ totalUnreadCount: number; unreadByCaseId: Record<string, number> }> {
    logChat('REQUEST: Get unread counts', {});
    const startTime = Date.now();
    
    try {
      const response = await apiClient.get<ApiResponse<{ totalUnreadCount: number; unreadByCaseId: Record<string, number> }>>('/chat/unread');
      
      const duration = Date.now() - startTime;
      logChat('RESPONSE: Get unread counts', {
        totalUnread: response.data.data.totalUnreadCount,
        caseCount: Object.keys(response.data.data.unreadByCaseId).length,
        duration: `${duration}ms`,
      });
      
      return response.data.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logChat('ERROR: Get unread counts', {
        error: error.message,
        status: error.response?.status,
        duration: `${duration}ms`,
      });
      throw error;
    }
  },
};

export default chatService;
