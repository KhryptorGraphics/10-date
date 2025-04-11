import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import './ChatPage.css';

// Types for our messages and match data
interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
}

interface Match {
  id: string;
  userId: string;
  name: string;
  profilePicture: string;
  lastActive: Date;
}

const SOCKET_URL = 'http://localhost:3000';

export default function ChatPage() {
  // Socket connection
  const socketRef = useRef<Socket | null>(null);
  
  // State for messages, active chat, and matches
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Reference for chat container to auto-scroll to bottom
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Current user ID (would come from auth context in a real app)
  const currentUserId = 'user1';

  // Initialize socket connection and fetch matches
  useEffect(() => {
    // Initialize Socket.io connection
    socketRef.current = io(SOCKET_URL);
    
    // Fetch matches from API
    fetchMatches();
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Handle socket events when active match changes
  useEffect(() => {
    if (!socketRef.current || !activeMatch) return;
    
    const roomId = getChatRoomId(currentUserId, activeMatch.userId);
    
    // Join room for this match
    socketRef.current.emit('joinRoom', roomId);
    
    // Fetch message history for this match
    fetchMessages(activeMatch.userId);
    
    // Listen for new messages
    socketRef.current.on('newMessage', (data: Message) => {
      setMessages(prev => [...prev, {
        ...data,
        timestamp: new Date(data.timestamp)
      }]);
      
      // Mark as read if from the other person
      if (data.senderId !== currentUserId) {
        markMessageAsRead(data.id);
      }
    });
    
    // Listen for typing indicators
    socketRef.current.on('userTyping', ({ userId }: { userId: string }) => {
      if (userId === activeMatch.userId) {
        setIsTyping(true);
        
        // Reset typing indicator after 3 seconds
        setTimeout(() => setIsTyping(false), 3000);
      }
    });
    
    // Listen for read receipts
    socketRef.current.on('messageRead', ({ messageId }: { messageId: string }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );
    });
    
    // Clean up listeners when changing active match
    return () => {
      if (socketRef.current) {
        socketRef.current.off('newMessage');
        socketRef.current.off('userTyping');
        socketRef.current.off('messageRead');
      }
    };
  }, [activeMatch]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch user's matches
  const fetchMatches = async () => {
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll use mock data
      const mockMatches: Match[] = [
        {
          id: 'match1',
          userId: 'user2',
          name: 'Alice Johnson',
          profilePicture: 'https://randomuser.me/api/portraits/women/32.jpg',
          lastActive: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
        },
        {
          id: 'match2',
          userId: 'user3',
          name: 'Bob Smith',
          profilePicture: 'https://randomuser.me/api/portraits/men/45.jpg',
          lastActive: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
        },
        {
          id: 'match3',
          userId: 'user4',
          name: 'Carol Davis',
          profilePicture: 'https://randomuser.me/api/portraits/women/58.jpg',
          lastActive: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
        }
      ];
      
      setMatches(mockMatches);
      
      // Set first match as active by default
      if (mockMatches.length > 0 && !activeMatch) {
        setActiveMatch(mockMatches[0]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch message history for a match
  const fetchMessages = async (matchUserId: string) => {
    try {
      setIsLoading(true);
      
      // In a real app, this would be an API call
      // For demo purposes, we'll use mock data
      const mockMessages: Message[] = [
        {
          id: 'm1',
          senderId: currentUserId,
          recipientId: matchUserId,
          content: 'Hey there! How are you doing today?',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          read: true
        },
        {
          id: 'm2',
          senderId: matchUserId,
          recipientId: currentUserId,
          content: 'Hi! I\'m doing great, thanks for asking! How about you?',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5), // 1.5 hours ago
          read: true
        },
        {
          id: 'm3',
          senderId: currentUserId,
          recipientId: matchUserId,
          content: 'I\'m good! Just working on some projects.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          read: true
        },
        {
          id: 'm4',
          senderId: matchUserId,
          recipientId: currentUserId,
          content: 'That sounds interesting! What kind of projects are you working on?',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          read: true
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a consistent room ID for two users
  const getChatRoomId = (userId1: string, userId2: string) => {
    return [userId1, userId2].sort().join('-');
  };

  // Mark a message as read
  const markMessageAsRead = (messageId: string) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('markMessageRead', { messageId });
  };

  // Handle sending a message
  const handleSend = () => {
    if (!message.trim() || !socketRef.current || !activeMatch) return;
    
    const roomId = getChatRoomId(currentUserId, activeMatch.userId);
    const newMessage: Omit<Message, 'id'> = {
      senderId: currentUserId,
      recipientId: activeMatch.userId,
      content: message.trim(),
      timestamp: new Date(),
      read: false
    };
    
    // Emit message to server
    socketRef.current.emit('sendMessage', {
      room: roomId,
      ...newMessage
    });
    
    // Add message to UI immediately (optimistic update)
    setMessages(prev => [...prev, { ...newMessage, id: `temp-${Date.now()}` }]);
    
    // Clear input
    setMessage('');
    
    // Hide emoji picker if open
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  };

  // Handle typing indicator
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (!socketRef.current || !activeMatch) return;
    
    // Emit typing event
    socketRef.current.emit('userTyping', {
      room: getChatRoomId(currentUserId, activeMatch.userId),
      userId: currentUserId
    });
    
    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout
    setTypingTimeout(setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit('userStoppedTyping', {
          room: getChatRoomId(currentUserId, activeMatch.userId),
          userId: currentUserId
        });
      }
    }, 2000));
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socketRef.current || !activeMatch) return;
    
    // In a real app, you'd upload to a server and get a URL back
    // For demo purposes, we'll just use a placeholder
    
    // Determine media type
    let mediaType: 'image' | 'video' | 'audio' | undefined;
    if (file.type.startsWith('image/')) mediaType = 'image';
    else if (file.type.startsWith('video/')) mediaType = 'video';
    else if (file.type.startsWith('audio/')) mediaType = 'audio';
    else return; // Unsupported file type
    
    const roomId = getChatRoomId(currentUserId, activeMatch.userId);
    const newMessage: Omit<Message, 'id'> = {
      senderId: currentUserId,
      recipientId: activeMatch.userId,
      content: `Sent a ${mediaType}`,
      timestamp: new Date(),
      read: false,
      mediaUrl: URL.createObjectURL(file), // This would be a server URL in production
      mediaType
    };
    
    // Emit message to server
    socketRef.current.emit('sendMessage', {
      room: roomId,
      ...newMessage
    });
    
    // Add message to UI immediately (optimistic update)
    setMessages(prev => [...prev, { ...newMessage, id: `temp-${Date.now()}` }]);
  };

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If less than 24 hours ago, show time
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString();
  };

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <h2>Your Matches</h2>
        <div className="matches-list">
          {matches.map(match => (
            <div 
              key={match.id} 
              className={`match-item ${activeMatch?.id === match.id ? 'active' : ''}`}
              onClick={() => setActiveMatch(match)}
            >
              <img 
                src={match.profilePicture} 
                alt={match.name} 
                className="match-avatar" 
              />
              <div className="match-info">
                <h3>{match.name}</h3>
                <p className="last-active">
                  Last active: {formatTimestamp(match.lastActive)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="chat-main">
        {activeMatch ? (
          <>
            <div className="chat-header">
              <img 
                src={activeMatch.profilePicture} 
                alt={activeMatch.name} 
                className="header-avatar" 
              />
              <div className="header-info">
                <h2>{activeMatch.name}</h2>
                <p className="online-status">
                  {new Date().getTime() - activeMatch.lastActive.getTime() < 5 * 60 * 1000 
                    ? 'Online' 
                    : `Last seen ${formatTimestamp(activeMatch.lastActive)}`
                  }
                </p>
              </div>
            </div>
            
            <div className="chat-messages" ref={chatContainerRef}>
              {isLoading ? (
                <div className="loading">Loading messages...</div>
              ) : (
                <>
                  {messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`message ${msg.senderId === currentUserId ? 'sent' : 'received'}`}
                    >
                      {msg.mediaUrl && msg.mediaType === 'image' && (
                        <img 
                          src={msg.mediaUrl} 
                          alt="Shared" 
                          className="message-media" 
                        />
                      )}
                      {msg.mediaUrl && msg.mediaType === 'video' && (
                        <video 
                          src={msg.mediaUrl} 
                          controls 
                          className="message-media"
                        />
                      )}
                      {msg.mediaUrl && msg.mediaType === 'audio' && (
                        <audio 
                          src={msg.mediaUrl} 
                          controls 
                          className="message-audio"
                        />
                      )}
                      <div className="message-bubble">
                        <p>{msg.content}</p>
                        <div className="message-meta">
                          <span className="message-time">
                            {formatTimestamp(msg.timestamp)}
                          </span>
                          {msg.senderId === currentUserId && (
                            <span className={`read-status ${msg.read ? 'read' : ''}`}>
                              {msg.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="chat-input-container">
              <button 
                className="emoji-button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                😊
              </button>
              
              {showEmojiPicker && (
                <div className="emoji-picker">
                  {/* For simplicity, just a few emojis */}
                  {['😊', '😂', '❤️', '👍', '🎉', '🔥', '😎', '🤔'].map(emoji => (
                    <span 
                      key={emoji} 
                      onClick={() => setMessage(prev => prev + emoji)}
                      className="emoji"
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              )}
              
              <label className="attach-button">
                📎
                <input 
                  type="file" 
                  accept="image/*,video/*,audio/*" 
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
              
              <input
                value={message}
                onChange={handleTyping}
                onKeyPress={handleKeyPress}
                placeholder="Type a message"
                className="message-input"
              />
              
              <button 
                className="send-button"
                onClick={handleSend}
                disabled={!message.trim()}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <p>Select a match to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
