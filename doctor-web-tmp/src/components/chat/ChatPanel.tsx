import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Send, 
  Loader2, 
  MessageSquare, 
  User, 
  Store, 
  RefreshCw,
  Paperclip,
  FileText,
  X,
  Download
} from 'lucide-react';
import { Button, Input, Spinner } from '@/components/ui';
import { chatService } from '@/services/chat.service';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import type { ChatMessage, SendMessageRequest } from '@/types';

interface ChatPanelProps {
  caseId: string;
  caseNumber: string;
  onClose?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const ChatPanel: React.FC<ChatPanelProps> = ({ caseId, caseNumber, onClose }) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch messages
  const { data: chatData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['chat-messages', caseId],
    queryFn: () => chatService.getMessages(caseId),
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (request: SendMessageRequest) => chatService.sendMessage(request),
    onSuccess: (newMessage) => {
      // Add the new message to the cache
      queryClient.setQueryData(['chat-messages', caseId], (old: typeof chatData) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...old.messages, newMessage],
        };
      });
      setMessage('');
      scrollToBottom();
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: () => chatService.markAsRead(caseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
    },
  });

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Track if we've already marked messages as read to prevent repeated calls
  const hasMarkedAsReadRef = useRef(false);
  const lastMessageCountRef = useRef(0);

  useEffect(() => {
    if (chatData?.messages.length) {
      // Only scroll if message count changed
      if (chatData.messages.length !== lastMessageCountRef.current) {
        lastMessageCountRef.current = chatData.messages.length;
        scrollToBottom();
      }
      
      // Mark messages as read only once when there are unread messages
      const hasUnread = chatData.messages.some(m => !m.isRead && !m.isOwnMessage);
      if (hasUnread && !hasMarkedAsReadRef.current) {
        hasMarkedAsReadRef.current = true;
        markAsReadMutation.mutate();
      } else if (!hasUnread) {
        hasMarkedAsReadRef.current = false;
      }
    }
  }, [chatData?.messages.length, scrollToBottom]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('File type not allowed. Allowed: Images, PDF, Word, Excel');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 10MB');
      return;
    }

    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedFile) || sendMessageMutation.isPending || isUploading) return;

    try {
      if (selectedFile) {
        // Upload file
        setIsUploading(true);
        const response = await chatService.uploadFileForm(caseId, selectedFile, message.trim() || undefined);
        
        if (response.message) {
          queryClient.setQueryData(['chat-messages', caseId], (old: typeof chatData) => {
            if (!old) return old;
            return {
              ...old,
              messages: [...old.messages, response.message!],
            };
          });
        }
        
        clearSelectedFile();
        setMessage('');
        scrollToBottom();
        toast.success('File sent successfully');
      } else {
        // Send text message
        sendMessageMutation.mutate({
          caseId,
          message: message.trim(),
          messageType: 'Text',
        });
      }
    } catch (error) {
      toast.error('Failed to send file');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary-600" />
          <div>
            <h3 className="font-medium text-gray-900">Chat - Case #{caseNumber}</h3>
            {chatData?.thread && (
              <p className="text-xs text-gray-500">
                With: {chatData.thread.pmvName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]"
      >
        {!chatData?.messages.length ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation with the pharmacy</p>
          </div>
        ) : (
          chatData.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 flex-1">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover rounded" />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={clearSelectedFile}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={ALLOWED_FILE_TYPES.join(',')}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={selectedFile ? "Add a caption..." : "Type your message..."}
            className="flex-1"
            disabled={sendMessageMutation.isPending || isUploading}
          />
          <Button
            type="submit"
            disabled={(!message.trim() && !selectedFile) || sendMessageMutation.isPending || isUploading}
          >
            {sendMessageMutation.isPending || isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isOwn = message.isOwnMessage;
  const isImage = message.messageType === 'Image';
  const isDocument = message.messageType === 'Document';
  const hasAttachment = message.attachmentUrl;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.senderRole === 'Doctor' 
            ? 'bg-primary-100 text-primary-600' 
            : 'bg-blue-100 text-blue-600'
        }`}>
          {message.senderRole === 'Doctor' ? (
            <User className="w-4 h-4" />
          ) : (
            <Store className="w-4 h-4" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          <span className="text-xs text-gray-500 mb-1">
            {message.senderName}
          </span>
          
          {/* Attachment */}
          {hasAttachment && (
            <div className={`mb-1 rounded-lg overflow-hidden ${
              isOwn ? 'bg-primary-600' : 'bg-gray-100'
            }`}>
              {isImage ? (
                <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={message.attachmentUrl} 
                    alt={message.attachmentName || 'Image'} 
                    className="max-w-xs max-h-48 object-cover"
                  />
                </a>
              ) : isDocument && (
                <a 
                  href={message.attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-3 py-2 ${
                    isOwn ? 'text-white hover:bg-primary-700' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-sm truncate max-w-[150px]">{message.attachmentName}</span>
                  <Download className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {/* Text Message - hide auto-generated captions */}
          {message.message && !(hasAttachment && message.message.startsWith('Sent a')) && (
            <div className={`px-4 py-2 rounded-2xl ${
              isOwn 
                ? 'bg-primary-600 text-white rounded-br-md' 
                : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }`}>
              <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
            </div>
          )}

          <span className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            {message.isRead && isOwn && (
              <span className="ml-1 text-primary-500">✓</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
