import apiClient from '../lib/api-client';

export interface Notification {
  id: string;
  type: 'ChatMessage' | 'NewCase' | 'CaseAssigned' | 'AdminMessage' | 'SystemAlert';
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  caseId?: string;
  caseNumber?: string;
  messageId?: string;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface UnreadCount {
  totalUnread: number;
  chatMessages: number;
  newCases: number;
  adminMessages: number;
}

export interface NotificationResponse {
  data: Notification[];
  message: string;
  success: boolean;
}

export interface UnreadCountResponse {
  data: UnreadCount;
  message: string;
  success: boolean;
}

class NotificationService {
  /**
   * Get notifications with optional filtering
   */
  async getNotifications(
    isRead?: boolean,
    page: number = 1,
    pageSize: number = 20
  ): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (isRead !== undefined) {
      params.append('isRead', String(isRead));
    }
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));

    const response = await apiClient.get<NotificationResponse>(
      `/notifications?${params.toString()}`
    );
    return response.data.data;
  }

  /**
   * Get unread notification counts
   */
  async getUnreadCount(): Promise<UnreadCount> {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data.data;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.post(`/notifications/${notificationId}/read`);
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    await apiClient.post('/notifications/mark-read', {
      notificationIds,
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/mark-all-read');
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  }

  /**
   * Register FCM token for push notifications
   */
  async registerFcmToken(
    fcmToken: string,
    deviceId: string,
    platform: string
  ): Promise<void> {
    await apiClient.post('/notifications/register-token', {
      fcmToken,
      deviceId,
      platform,
    });
  }

  /**
   * Group notifications by date
   */
  groupNotificationsByDate(notifications: Notification[]): Map<string, Notification[]> {
    const grouped = new Map<string, Notification[]>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach((notification) => {
      const notificationDate = new Date(notification.createdAt);
      notificationDate.setHours(0, 0, 0, 0);

      let dateKey: string;
      if (notificationDate.getTime() === today.getTime()) {
        dateKey = 'Today';
      } else if (notificationDate.getTime() === yesterday.getTime()) {
        dateKey = 'Yesterday';
      } else if (notificationDate > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        dateKey = notificationDate.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        dateKey = notificationDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(notification);
    });

    return grouped;
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: Notification['type']): string {
    switch (type) {
      case 'ChatMessage':
        return 'chatbubble';
      case 'NewCase':
      case 'CaseAssigned':
        return 'folder-open';
      case 'AdminMessage':
        return 'mail';
      case 'SystemAlert':
        return 'alert-circle';
      default:
        return 'notifications';
    }
  }

  /**
   * Get notification color based on type
   */
  getNotificationColor(type: Notification['type']): string {
    switch (type) {
      case 'ChatMessage':
        return '#0088CC';
      case 'NewCase':
      case 'CaseAssigned':
        return '#4CAF50';
      case 'AdminMessage':
        return '#FF9800';
      case 'SystemAlert':
        return '#F44336';
      default:
        return '#757575';
    }
  }
}

export default new NotificationService();
