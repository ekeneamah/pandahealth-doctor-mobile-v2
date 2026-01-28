import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import fcmService from '../../services/fcm.service';
import notificationService, { Notification } from '../../services/notification.service';

interface GroupedNotification {
  date: string;
  notifications: Notification[];
}

export default function NotificationsScreen() {
  const router = useRouter();
  const swipeGesture = useSwipeNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<GroupedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const isRead = filter === 'unread' ? false : undefined;
      const data = await notificationService.getNotifications(isRead, 1, 50);
      
      setNotifications(data);

      // Group notifications by date
      const grouped = notificationService.groupNotificationsByDate(data);
      const groupedArray: GroupedNotification[] = [];
      grouped.forEach((notifications, date) => {
        groupedArray.push({ date, notifications });
      });
      setGroupedNotifications(groupedArray);

      // Get unread count
      const countData = await notificationService.getUnreadCount();
      setUnreadCount(countData.totalUnread || 0);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Update badge count when unread count changes
  useEffect(() => {
    fcmService.setBadgeCount(unreadCount);
  }, [unreadCount]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id);
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Navigate based on notification type
      switch (notification.type) {
        case 'ChatMessage':
          if (notification.caseId) {
            router.push(`/chat/${notification.caseId}`);
          }
          break;
        case 'NewCase':
        case 'CaseAssigned':
          if (notification.caseId) {
            router.push(`/case/${notification.caseId}`);
          }
          break;
        case 'AdminMessage':
          router.push({
            pathname: '/message/[id]',
            params: { id: notification.id },
          });
          break;
        default:
          break;
      }
    } catch (error: any) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      Alert.alert('Success', 'Notification deleted');
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const iconName = notificationService.getNotificationIcon(item.type);
    const iconColor = notificationService.getNotificationColor(item.type);
    const timeAgo = getTimeAgo(new Date(item.createdAt));

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={iconName as any} size={24} color={iconColor} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.timeText}>{timeAgo}</Text>
            {item.caseNumber && (
              <Text style={styles.caseNumber}>Case #{item.caseNumber}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            Alert.alert(
              'Delete Notification',
              'Are you sure you want to delete this notification?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => handleDeleteNotification(item.id),
                },
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#999" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ item }: { item: GroupedNotification }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{item.date}</Text>
    </View>
  );

  const renderGroupedItem = ({ item }: { item: GroupedNotification }) => (
    <View>
      {renderSectionHeader({ item })}
      {item.notifications.map((notification) => (
        <View key={notification.id}>{renderNotificationItem({ item: notification })}</View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0088CC" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.container}>
        {/* Header Actions */}
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
              <Ionicons name="checkmark-done-outline" size={20} color="#0088CC" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilterButton]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'unread' && styles.activeFilterButton]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </Text>
          </TouchableOpacity>
        </View>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedNotifications}
          renderItem={renderGroupedItem}
          keyExtractor={(item) => item.date}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
      </View>
    </GestureDetector>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + 'y ago';
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + 'mo ago';
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + 'd ago';
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + 'h ago';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + 'm ago';
  }
  return Math.floor(seconds) + 's ago';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    color: '#0088CC',
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeFilterButton: {
    backgroundColor: '#0088CC',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'flex-start',
  },
  unreadNotification: {
    backgroundColor: '#f8f9ff',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0088CC',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  caseNumber: {
    fontSize: 12,
    color: '#0088CC',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
