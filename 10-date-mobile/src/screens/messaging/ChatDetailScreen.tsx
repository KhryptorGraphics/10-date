/**
 * Chat Detail Screen
 * 
 * Implements a real-time messaging interface between matched users
 * with features like message history, typing indicators, and media sharing.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import { useGetMessagesQuery, useSendMessageMutation } from '../../store/api';
import { useAppSelector } from '../../store';
import { ChatDetailScreenProps } from '../../types/navigation';
import { primaryColors, neutralColors, spacing, typography, shadows } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Socket } from 'socket.io-client';
import { useSocketConnection } from '../../hooks/useSocketConnection';

// Message interface
interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  status: 'sent' | 'delivered' | 'read';
}

const ChatDetailScreen: React.FC<ChatDetailScreenProps> = ({ 
  route, 
  navigation 
}) => {
  // Extract params
  const { matchId, userName } = route.params;
  
  // State
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingIndicatorOpacity = useRef(new Animated.Value(0)).current;
  
  // Get current user info from Redux
  const { user } = useAppSelector(state => state.auth);
  
  // RTK Query hooks
  const { 
    data: messagesData, 
    isLoading, 
    isError, 
    refetch 
  } = useGetMessagesQuery(matchId);
  
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  
  // Socket connection for real-time messaging
  const socket = useSocketConnection();
  
  // Set up socket listeners
  useEffect(() => {
    if (!socket) return;
    
    // Listen for new messages
    socket.on('message', (newMessage: Message) => {
      // Messages will be updated automatically by RTK Query invalidation,
      // but we can scroll to bottom to see the new message
      scrollToBottom();
    });
    
    // Listen for typing indicators
    socket.on('typing', (data: { userId: string, matchId: string }) => {
      if (data.matchId === matchId && data.userId !== user?.id) {
        setPartnerIsTyping(true);
        
        // Animate typing indicator
        Animated.timing(typingIndicatorOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
        
        // Hide typing indicator after 3 seconds of no updates
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          setPartnerIsTyping(false);
          
          Animated.timing(typingIndicatorOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }, 3000);
      }
    });
    
    // Join the chat room
    socket.emit('join_chat', { matchId });
    
    // Clean up listeners when component unmounts
    return () => {
      socket.off('message');
      socket.off('typing');
      socket.emit('leave_chat', { matchId });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, matchId, user?.id, typingIndicatorOpacity]);
  
  // Set up navigation header
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: 'https://example.com/placeholder-avatar.jpg' }} // Replace with actual user avatar
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerTitle}>{userName}</Text>
            {partnerIsTyping && (
              <Text style={styles.typingText}>typing...</Text>
            )}
          </View>
        </View>
      ),
    });
  }, [navigation, userName, partnerIsTyping]);
  
  // Handle text input changes
  const handleTextChange = (text: string) => {
    setMessageText(text);
    
    // Emit typing event to server
    if (text.length > 0 && !isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing', { matchId, userId: user?.id });
      
      // Reset typing status after 3 seconds
      setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }
  };
  
  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    try {
      await sendMessage({
        matchId,
        content: messageText,
      }).unwrap();
      
      // Clear input
      setMessageText('');
      
      // Scroll to bottom
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message to user
    }
  };
  
  // Scroll to bottom of message list
  const scrollToBottom = () => {
    if (flatListRef.current && messagesData?.length) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };
  
  // Auto-scroll when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messagesData?.length]);
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time only
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'MMM d, h:mm a');
    }
    
    // Otherwise, show full date
    return format(date, 'MMM d, yyyy, h:mm a');
  };
  
  // Determine if adjacent messages should be grouped
  const shouldGroupMessages = (message: Message, previousMessage?: Message) => {
    if (!previousMessage) return false;
    
    const currentDate = new Date(message.timestamp);
    const prevDate = new Date(previousMessage.timestamp);
    
    // Group messages if:
    // 1. Same sender
    // 2. Less than 5 minutes apart
    return (
      message.senderId === previousMessage.senderId &&
      (currentDate.getTime() - prevDate.getTime()) < 5 * 60 * 1000
    );
  };
  
  // Render message item
  const renderMessageItem = ({ item, index }: { item: Message, index: number }) => {
    const previousMessage = index > 0 ? messagesData?.[index - 1] : undefined;
    const isGrouped = shouldGroupMessages(item, previousMessage);
    const isCurrentUser = item.senderId === user?.id;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.sentMessageContainer : styles.receivedMessageContainer,
          isGrouped && styles.groupedMessage,
        ]}
      >
        {item.mediaUrl && (
          <TouchableOpacity
            style={styles.mediaContainer}
            onPress={() => {
              // Open media viewer
            }}
          >
            {item.mediaType === 'image' && (
              <Image
                source={{ uri: item.mediaUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            )}
            {item.mediaType === 'video' && (
              <View style={styles.videoContainer}>
                <Image
                  source={{ uri: item.mediaUrl }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
                <View style={styles.playButtonContainer}>
                  <Ionicons name="play" size={24} color={neutralColors.white} />
                </View>
              </View>
            )}
          </TouchableOpacity>
        )}
        
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.sentBubble : styles.receivedBubble,
          ]}
        >
          <Text style={styles.messageText}>{item.content}</Text>
        </View>
        
        <Text
          style={[
            styles.timestamp,
            isCurrentUser ? styles.sentTimestamp : styles.receivedTimestamp,
          ]}
        >
          {formatTimestamp(item.timestamp)}
        </Text>
        
        {isCurrentUser && (
          <View style={styles.messageStatus}>
            {item.status === 'sent' && (
              <Ionicons name="checkmark" size={12} color={neutralColors.gray500} />
            )}
            {item.status === 'delivered' && (
              <Ionicons name="checkmark-done" size={12} color={neutralColors.gray500} />
            )}
            {item.status === 'read' && (
              <Ionicons name="checkmark-done" size={12} color={primaryColors.primary} />
            )}
          </View>
        )}
      </View>
    );
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColors.primary} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }
  
  // Show error state
  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={70} color={primaryColors.error} />
        <Text style={styles.errorTitle}>Couldn't Load Messages</Text>
        <Text style={styles.errorText}>
          We're having trouble loading your conversation.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Message list */}
      <FlatList
        ref={flatListRef}
        data={messagesData}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        inverted={false}
        onContentSizeChange={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Start a conversation with {userName}</Text>
          </View>
        }
      />
      
      {/* Partner typing indicator */}
      <Animated.View
        style={[
          styles.typingIndicatorContainer,
          { opacity: typingIndicatorOpacity },
        ]}
      >
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      </Animated.View>
      
      {/* Message input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="attach" size={24} color={neutralColors.gray600} />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={messageText}
          onChangeText={handleTextChange}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            !messageText.trim() && styles.sendButtonDisabled,
          ]}
          disabled={!messageText.trim() || isSending}
          onPress={handleSendMessage}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={neutralColors.white} />
          ) : (
            <Ionicons name="send" size={20} color={neutralColors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutralColors.gray100,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: neutralColors.gray900,
  },
  typingText: {
    fontSize: typography.fontSize.sm,
    color: neutralColors.gray600,
    fontStyle: 'italic',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageContainer: {
    marginBottom: spacing.md,
    maxWidth: '80%',
  },
  sentMessageContainer: {
    alignSelf: 'flex-end',
  },
  receivedMessageContainer: {
    alignSelf: 'flex-start',
  },
  groupedMessage: {
    marginBottom: spacing.xs,
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: 20,
    ...shadows.sm,
  },
  sentBubble: {
    backgroundColor: primaryColors.primary,
    borderTopRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: neutralColors.white,
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: typography.fontSize.md,
    color: neutralColors.white,
  },
  mediaContainer: {
    marginBottom: spacing.xs,
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: 240,
  },
  messageImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  videoContainer: {
    position: 'relative',
  },
  playButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs / 2,
  },
  sentTimestamp: {
    color: neutralColors.gray200,
    alignSelf: 'flex-end',
    marginRight: spacing.xs,
  },
  receivedTimestamp: {
    color: neutralColors.gray500,
    alignSelf: 'flex-start',
    marginLeft: spacing.xs,
  },
  messageStatus: {
    position: 'absolute',
    bottom: -4,
    right: -12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: neutralColors.white,
    borderTopWidth: 1,
    borderTopColor: neutralColors.gray200,
  },
  attachButton: {
    padding: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: neutralColors.gray100,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.sm,
    fontSize: typography.fontSize.md,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: primaryColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: neutralColors.gray400,
  },
  typingIndicatorContainer: {
    position: 'absolute',
    bottom: 80,
    left: spacing.md,
  },
  typingBubble: {
    backgroundColor: neutralColors.white,
    borderRadius: 20,
    padding: spacing.sm,
    ...shadows.sm,
  },
  typingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 20,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: neutralColors.gray400,
    marginHorizontal: 2,
  },
  typingDot1: {
    animationName: 'typingAnimation',
    animationDuration: '1s',
    animationIterationCount: 'infinite',
  },
  typingDot2: {
    animationName: 'typingAnimation',
    animationDuration: '1s',
    animationDelay: '0.2s',
    animationIterationCount: 'infinite',
  },
  typingDot3: {
    animationName: 'typingAnimation',
    animationDuration: '1s',
    animationDelay: '0.4s',
    animationIterationCount: 'infinite',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: neutralColors.gray700,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: neutralColors.gray900,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    color: neutralColors.gray700,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: primaryColors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 25,
  },
  retryButtonText: {
    color: neutralColors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: neutralColors.gray600,
    textAlign: 'center',
  },
});

export default ChatDetailScreen;
