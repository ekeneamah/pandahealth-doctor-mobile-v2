import { colors } from '@/src/constants/theme';
import type { ChatMessage as APIChatMessage } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import storageService from '../../services/storage.service';

interface ChatMessage {
  id: string;
  sender: 'doctor' | 'pmv';
  message: string;
  timestamp: Date;
  messageType?: 'Text' | 'Image' | 'Document';
  attachmentUrl?: string;
  attachmentName?: string;
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
  const [isClaiming, setIsClaiming] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    type: 'Image' | 'Document';
    uri: string;
    name?: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

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
      
      // Auto-claim case if not claimed yet
      if (!data.doctorId && data.status === 'Pending') {
        console.log('[CaseChatScreen] Auto-claiming unclaimed case:', {
          caseId: id,
          caseNumber: data.caseNumber
        });
        
        const claimResponse = await caseService.claimCase(id);
        if (claimResponse.success && claimResponse.data) {
          console.log('[CaseChatScreen] Case auto-claimed successfully:', {
            caseId: id,
            doctorId: claimResponse.data.doctorId
          });
          setCaseData(claimResponse.data);
        } else {
          console.warn('[CaseChatScreen] Failed to auto-claim case:', {
            caseId: id,
            message: claimResponse.message
          });
          // Still set the original case data to allow viewing
          setCaseData(data);
        }
      } else {
        setCaseData(data);
      }
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
        messageType: msg.messageType,
        attachmentUrl: msg.attachmentUrl,
        attachmentName: msg.attachmentName,
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
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access photos is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedAttachment({
          type: 'Image',
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || 'image.jpg',
        });
      }
    } catch (error) {
      console.error('[CaseChatScreen] Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedAttachment({
          type: 'Document',
          uri: result.assets[0].uri,
          name: result.assets[0].name,
        });
      }
    } catch (error) {
      console.error('[CaseChatScreen] Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleRemoveAttachment = () => {
    setSelectedAttachment(null);
  };
  const handleClaimCase = async () => {
    console.log('[CaseChatScreen] Claiming case:', { caseId: id });
    setIsClaiming(true);
    
    try {
      const startTime = Date.now();
      const response = await caseService.claimCase(id);
      const duration = Date.now() - startTime;
      
      if (response.success && response.data) {
        console.log('[CaseChatScreen] Case claimed successfully:', {
          caseId: id,
          caseNumber: response.data.caseNumber,
          doctorId: response.data.doctorId,
          duration: `${duration}ms`
        });
        
        // Update the case data
        setCaseData(response.data);
        
        Alert.alert(
          'Success', 
          'Case claimed successfully. You can now chat with the PMV.',
          [{ text: 'OK' }]
        );
      } else {
        console.error('[CaseChatScreen] Failed to claim case:', {
          caseId: id,
          message: response.message
        });
        Alert.alert('Error', response.message || 'Failed to claim case');
      }
    } catch (error: any) {
      console.error('[CaseChatScreen] Error claiming case:', {
        caseId: id,
        error: error.message,
        response: error.response?.data
      });
      Alert.alert('Error', 'Failed to claim case. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };
  const handleSend = async () => {
    if (!newMessage.trim() && !selectedAttachment) {
      console.log('[CaseChatScreen] Send blocked: empty message and no attachment');
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
        'Case Not Claimed',
        'To chat with the PMV, you need to claim this case first. Would you like to claim it now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Claim Case', 
            onPress: handleClaimCase
          }
        ]
      );
      return;
    }

    const messageText = newMessage.trim() || (selectedAttachment ? `Sent a ${selectedAttachment.type.toLowerCase()}` : '');
    
    console.log('[CaseChatScreen] Sending message:', {
      caseId: id,
      messageText,
      hasAttachment: !!selectedAttachment,
      attachmentType: selectedAttachment?.type,
      hasDoctorId: !!caseData.doctorId,
      caseStatus: caseData.status
    });

    setSending(true);
    setUploadProgress(0);
    const startTime = Date.now();
    
    try {
      let attachmentUrl: string | undefined;
      let attachmentName: string | undefined;

      // Upload attachment to Firebase Storage if present
      if (selectedAttachment) {
        console.log('[CaseChatScreen] Uploading attachment to Firebase Storage');
        
        if (selectedAttachment.type === 'Image') {
          const uploadResult = await storageService.uploadImage(
            selectedAttachment.uri,
            id,
            (progress) => {
              setUploadProgress(progress.progress);
              console.log('[CaseChatScreen] Upload progress:', progress.progress + '%');
            }
          );
          attachmentUrl = uploadResult.url;
          attachmentName = uploadResult.name;
          console.log('[CaseChatScreen] Image uploaded:', { url: attachmentUrl, name: attachmentName });
        } else if (selectedAttachment.type === 'Document') {
          const uploadResult = await storageService.uploadDocument(
            selectedAttachment.uri,
            id,
            selectedAttachment.name || 'document',
            (progress) => {
              setUploadProgress(progress.progress);
              console.log('[CaseChatScreen] Upload progress:', progress.progress + '%');
            }
          );
          attachmentUrl = uploadResult.url;
          attachmentName = uploadResult.name;
          console.log('[CaseChatScreen] Document uploaded:', { url: attachmentUrl, name: attachmentName });
        }
      }

      // Send message with Firebase Storage URL
      const apiMessage = await chatService.sendMessage({
        caseId: id,
        message: messageText,
        messageType: selectedAttachment?.type || 'Text',
        attachmentUrl,
        attachmentName,
      });
      
      // Convert API response to local format
      const message: ChatMessage = {
        id: apiMessage.id,
        sender: 'doctor',
        message: apiMessage.message,
        timestamp: new Date(apiMessage.createdAt),
        messageType: apiMessage.messageType,
        attachmentUrl: apiMessage.attachmentUrl,
        attachmentName: apiMessage.attachmentName,
      };

      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      setSelectedAttachment(null);
      setUploadProgress(0);
      
      const duration = Date.now() - startTime;
      console.log('[CaseChatScreen] Message sent successfully:', {
        caseId: id,
        messageId: message.id,
        hasAttachment: !!attachmentUrl,
        duration: `${duration}ms`,
        totalMessages: messages.length + 1,
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
              {caseData.pmvBusinessName || caseData.pmvName || 'PMV'}
            </Text>
            {caseData.pmvBusinessName && caseData.pmvName && (
              <Text style={styles.headerPmvName}>
                {caseData.pmvName}
              </Text>
            )}
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
                
                {/* Image Attachment */}
                {msg.messageType === 'Image' && msg.attachmentUrl && (
                  <Image
                    source={{ uri: msg.attachmentUrl }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                )}

                {/* Document Attachment */}
                {msg.messageType === 'Document' && msg.attachmentName && (
                  <View style={styles.documentAttachment}>
                    <Ionicons name="document-text" size={24} color={colors.primary[600]} />
                    <Text style={styles.documentName} numberOfLines={1}>
                      {msg.attachmentName}
                    </Text>
                  </View>
                )}

                {/* Message Text */}
                {msg.message && (
                  <Text
                    style={[
                      styles.messageText,
                      msg.sender === 'doctor' ? styles.doctorText : styles.pmvText,
                    ]}
                  >
                    {msg.message}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {/* Selected Attachment Preview */}
          {selectedAttachment && (
            <View style={styles.attachmentPreview}>
              <View style={styles.attachmentPreviewContent}>
                {selectedAttachment.type === 'Image' ? (
                  <Image
                    source={{ uri: selectedAttachment.uri }}
                    style={styles.attachmentPreviewImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.attachmentPreviewDoc}>
                    <Ionicons name="document-text" size={32} color={colors.primary[600]} />
                    <Text style={styles.attachmentPreviewName} numberOfLines={1}>
                      {selectedAttachment.name}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={handleRemoveAttachment}
                style={styles.attachmentRemoveButton}
              >
                <Ionicons name="close-circle" size={24} color={colors.error[600]} />
              </TouchableOpacity>
            </View>
          )}

          {/* Upload Progress */}
          {sending && uploadProgress > 0 && uploadProgress < 100 && (
            <View style={styles.uploadProgressContainer}>
              <View style={styles.uploadProgressBar}>
                <View style={[styles.uploadProgressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.uploadProgressText}>{uploadProgress}% uploaded</Text>
            </View>
          )}

          <View style={styles.inputWrapper}>
            {/* Attachment Buttons */}
            <View style={styles.attachmentButtons}>
              <TouchableOpacity
                onPress={handlePickImage}
                style={styles.attachmentButton}
                disabled={sending}
              >
                <Ionicons name="image-outline" size={24} color={colors.primary[600]} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePickDocument}
                style={styles.attachmentButton}
                disabled={sending}
              >
                <Ionicons name="document-attach-outline" size={24} color={colors.primary[600]} />
              </TouchableOpacity>
            </View>

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
              style={[
                styles.sendButton,
                (!newMessage.trim() && !selectedAttachment) && styles.sendButtonDisabled
              ]}
              onPress={handleSend}
              disabled={(!newMessage.trim() && !selectedAttachment) || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={(newMessage.trim() || selectedAttachment) ? colors.white : colors.gray[400]}
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
  headerPmvName: {
    fontSize: 12,
    color: colors.primary[200],
    marginTop: 2,
    fontStyle: 'italic',
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
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  documentAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  documentName: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.gray[900],
    flex: 1,
  },
  attachmentButtons: {
    flexDirection: 'row',
    marginRight: 8,
    gap: 4,
  },
  attachmentButton: {
    padding: 8,
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  attachmentPreviewContent: {
    flex: 1,
  },
  attachmentPreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  attachmentPreviewDoc: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentPreviewName: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.gray[900],
    flex: 1,
  },
  attachmentRemoveButton: {
    marginLeft: 8,
  },
  uploadProgressContainer: {
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  uploadProgressBar: {
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: colors.primary[600],
    borderRadius: 2,
  },
  uploadProgressText: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: 4,
    textAlign: 'center',
  },
});
