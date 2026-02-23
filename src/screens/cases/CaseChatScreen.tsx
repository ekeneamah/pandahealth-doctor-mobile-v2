import { colors } from '@/src/constants/theme';
import type { ChatMessage as APIChatMessage } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import caseService, { Case } from '../../services/case.service';
import chatService from '../../services/chat.service';

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'pmv';
  message: string;
  timestamp: Date;
}

export default function CaseChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadCaseData();
    loadMessages();
  }, [id]);

  const loadCaseData = async () => {
    console.log('[CaseChatScreen] Loading case data:', { caseId: id });
    try {
      setLoading(true);
      const startTime = Date.now();
      const response = await caseService.getById(id);
      const duration = Date.now() - startTime;
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load case');
      }
      
      const data = response.data;
      
      console.log('[CaseChatScreen] Case data loaded:', {
        caseId: id,
        patientName: data.patientName,
        status: data.status,
        hasDoctorId: !!data.doctorId,
        doctorId: data.doctorId,
        pmvId: data.pmvId,
        caseNumber: data.caseNumber,
        duration: `${duration}ms`
      });
      
      // Warn if case not claimed
      if (!data.doctorId) {
        console.warn('[CaseChatScreen] WARNING: Case has no doctorId assigned!', {
          caseId: id,
          status: data.status,
          caseNumber: data.caseNumber
        });
      }
      
      setCaseData(data);
    } catch (error: any) {
      console.error('[CaseChatScreen] Error loading case:', {
        caseId: id,
        error: error.message,
        response: error.response?.data
      });
      Alert.alert('Error', 'Failed to load case details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    console.log('[CaseChatScreen] Loading messages for case:', { caseId: id });
    try {
      const response = await chatService.getMessages(id, 50);
      
      // Get case data first to determine sender roles
      const caseResponse = await caseService.getById(id);
      if (!caseResponse.success || !caseResponse.data) {
        throw new Error('Failed to load case data');
      }
      
      const currentCase = caseResponse.data;
      
      // Convert API messages to local format using senderId comparison
      const apiMessages: ChatMessage[] = response.messages.map((msg: APIChatMessage) => ({
        id: msg.id,
        sender: msg.senderId === currentCase.doctorId ? 'doctor' : 'pmv',
        message: msg.message,
        timestamp: new Date(msg.createdAt),
      }));
      
      console.log('[CaseChatScreen] Messages loaded:', {
        caseId: id,
        messageCount: apiMessages.length,
        hasMore: response.hasMore,
        doctorId: currentCase.doctorId,
        pmvId: currentCase.pmvId
      });
      
      setMessages(apiMessages);
      
      // Mark messages as read
      if (apiMessages.length > 0) {
        await chatService.markAsRead(id);
      }
    } catch (error: any) {
      console.error('[CaseChatScreen] Error loading messages:', {
        caseId: id,
        error: error.message,
        status: error.response?.status
      });
      
      // Don't clear messages on error - keep any existing messages
      // Just log the error for now
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) {
      console.log('[CaseChatScreen] Send blocked: empty message');
      return;
    }

    // Check if case has been claimed
    if (!caseData?.doctorId) {
      console.error('[CaseChatScreen] Case not claimed:', {
        caseId: id,
        hasDoctorId: !!caseData?.doctorId,
        caseStatus: caseData?.status
      });
      Alert.alert(
        'Cannot Send Message',
        'This case has not been claimed yet. Please claim the case first before starting a chat.',
        [
          { text: 'OK' },
          { text: 'Claim Case', onPress: () => router.back() }
        ]
      );
      return;
    }

    const messageText = newMessage.trim();
    const messageLength = messageText.length;
    
    console.log('[CaseChatScreen] Sending message:', {
      caseId: id,
      messageLength,
      messagePreview: messageText.slice(0, 50) + (messageLength > 50 ? '...' : ''),
      hasDoctorId: !!caseData.doctorId,
      caseStatus: caseData.status
    });

    setSending(true);
    const startTime = Date.now();
    
    try {
      // Send message via API
      const apiMessage = await chatService.sendMessage({
        caseId: id,
        message: messageText,
        messageType: 'Text',
      });
      
      // Convert API response to local format
      const message: ChatMessage = {
        id: apiMessage.id,
        sender: 'doctor',
        message: apiMessage.message,
        timestamp: new Date(apiMessage.createdAt),
      };

      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      
      const duration = Date.now() - startTime;
      console.log('[CaseChatScreen] Message sent successfully:', {
        caseId: id,
        messageId: message.id,
        duration: `${duration}ms`,
        totalMessages: messages.length + 1,
        isLocalOnly: false
      });

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('[CaseChatScreen] Error sending message:', {
        caseId: id,
        error: error.message,
        duration: `${duration}ms`,
        response: error.response?.data
      });
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  if (!caseData) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.gray[300]} />
        <Text style={styles.errorText}>Case not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Case #{caseData.caseNumber || id?.slice(0, 8)}</Text>
            <Text style={styles.headerSubtitle}>
              Chat with {caseData.patientName || 'PMV'}
            </Text>
          </View>
          <View style={[styles.statusBadge, getStatusStyle(caseData.status)]}>
            <Text style={styles.statusText}>{caseData.status}</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation with the PMV</Text>
            </View>
          ) : (
            messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.sender === 'doctor' ? styles.doctorBubble : styles.pmvBubble,
                ]}
              >
                <View style={styles.messageHeader}>
                  <Text style={styles.messageSender}>
                    {msg.sender === 'doctor' ? 'You' : 'PMV'}
                  </Text>
                  <Text style={styles.messageTime}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.messageText,
                    msg.sender === 'doctor' ? styles.doctorText : styles.pmvText,
                  ]}
                >
                  {msg.message}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={colors.gray[400]}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={newMessage.trim() ? colors.white : colors.gray[400]}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'Pending':
      return styles.statusPending;
    case 'InReview':
      return styles.statusInReview;
    case 'Diagnosed':
      return styles.statusDiagnosed;
    case 'Completed':
      return styles.statusCompleted;
    default:
      return styles.statusPending;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray[600],
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray[500],
  },
  header: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.primary[100],
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  statusPending: {
    backgroundColor: colors.warning[500],
  },
  statusInReview: {
    backgroundColor: colors.primary[500],
  },
  statusDiagnosed: {
    backgroundColor: colors.success[500],
  },
  statusCompleted: {
    backgroundColor: colors.gray[500],
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[700],
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: 8,
  },
  messageBubble: {
    marginBottom: 12,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  doctorBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary[600],
    borderBottomRightRadius: 4,
  },
  pmvBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray[700],
  },
  messageTime: {
    fontSize: 11,
    color: colors.gray[600],
    marginLeft: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  doctorText: {
    color: colors.white,
  },
  pmvText: {
    color: colors.gray[900],
  },
  inputContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: colors.gray[900],
  },
  sendButton: {
    backgroundColor: colors.primary[600],
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
});
