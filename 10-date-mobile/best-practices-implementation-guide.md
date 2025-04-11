# 10-Date Mobile App: Best Practices Implementation Guide

This guide provides detailed best practices and implementation steps for bringing the 10-Date mobile application to production. It builds upon the existing documentation and outlines specific approaches for each critical aspect of the production deployment process.

## 1. Installing & Managing Dependencies

While basic dependency installation is covered in the `production-readiness-steps.md` document, there are several best practices to consider:

### Dependency Management Best Practices

```bash
# Use exact versions for production dependencies to ensure consistency
npm config set save-exact true

# Periodically audit dependencies for security vulnerabilities
npm audit fix

# Consider using npm ci instead of npm install in your CI/CD pipeline
# This ensures consistent installations by using package-lock.json
npm ci
```

### Recommended Tools for Dependency Management

- **Renovate or Dependabot**: Set up automated dependency updates with these tools to stay current with security patches.
- **Bundle Analyzer**: Monitor and optimize your bundle size:

```bash
npm install --save-dev react-native-bundle-analyzer
npx react-native-bundle-analyzer
```

## 2. Connecting Frontend Components to Backend API

### API Integration Best Practices

Our application follows a structured approach using Redux Toolkit Query for API interactions. Here are some additional best practices:

#### 1. Environment Configuration

Create separate environment configurations for development, staging, and production:

```typescript
// src/config/environment.ts
type Environment = 'development' | 'staging' | 'production';

const ENV: Environment = process.env.NODE_ENV as Environment || 'development';

const configs = {
  development: {
    apiUrl: 'http://localhost:3000/api',
    socketUrl: 'http://localhost:3001',
    logLevel: 'debug',
  },
  staging: {
    apiUrl: 'https://staging-api.10-date.com/api',
    socketUrl: 'https://staging-socket.10-date.com',
    logLevel: 'info',
  },
  production: {
    apiUrl: 'https://api.10-date.com/api',
    socketUrl: 'https://socket.10-date.com',
    logLevel: 'error',
  },
};

export default configs[ENV];
```

#### 2. API Response Caching Strategy

Implement optimized caching strategies for API responses:

```typescript
// Modify existing RTK Query API setup to include caching policies
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: config.apiUrl,
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Profile', 'Matches', 'Conversations', 'Messages'],
  endpoints: (builder) => ({
    // Implement cache policies for frequently accessed data
    getUserProfile: builder.query({
      query: () => 'user/profile',
      providesTags: ['Profile'],
      // Keep data fresh for 5 minutes
      keepUnusedDataFor: 300,
    }),
    
    // Real-time data should have shorter cache times
    getMessages: builder.query({
      query: (matchId) => `messaging/messages/${matchId}`,
      providesTags: (result, error, matchId) => 
        result 
          ? [
              ...result.map(({ id }) => ({ type: 'Messages', id })),
              { type: 'Messages', id: matchId },
            ]
          : [{ type: 'Messages', id: matchId }],
      // Short cache time for messages
      keepUnusedDataFor: 30,
    }),
  }),
});
```

#### 3. Offline Support

Implement offline capabilities for critical features:

```typescript
// src/services/offline-sync.service.ts
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineSyncService {
  private pendingActions: Array<{
    type: string;
    payload: any;
    timestamp: number;
  }> = [];
  
  constructor() {
    this.loadPendingActions();
    this.setupNetworkListener();
  }
  
  // Load any pending actions from storage
  private async loadPendingActions() {
    try {
      const storedActions = await AsyncStorage.getItem('pendingActions');
      if (storedActions) {
        this.pendingActions = JSON.parse(storedActions);
      }
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    }
  }
  
  // Listen for network state changes
  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      if (state.isConnected && this.pendingActions.length > 0) {
        this.syncPendingActions();
      }
    });
  }
  
  // Add an action to the queue when offline
  public queueAction(type: string, payload: any) {
    const action = {
      type,
      payload,
      timestamp: Date.now(),
    };
    
    this.pendingActions.push(action);
    this.savePendingActions();
    return action;
  }
  
  // Save pending actions to persistent storage
  private async savePendingActions() {
    try {
      await AsyncStorage.setItem('pendingActions', JSON.stringify(this.pendingActions));
    } catch (error) {
      console.error('Failed to save pending actions:', error);
    }
  }
  
  // Sync pending actions when back online
  private async syncPendingActions() {
    // Process actions in order
    const actionsToProcess = [...this.pendingActions];
    this.pendingActions = [];
    
    for (const action of actionsToProcess) {
      try {
        // Dispatch the action through appropriate service
        switch (action.type) {
          case 'SEND_MESSAGE':
            await this.processMessageAction(action.payload);
            break;
          case 'UPDATE_PROFILE':
            await this.processProfileAction(action.payload);
            break;
          default:
            console.warn('Unknown action type:', action.type);
        }
      } catch (error) {
        console.error(`Failed to process offline action ${action.type}:`, error);
        // Re-queue failed actions
        this.pendingActions.push(action);
      }
    }
    
    // Save the updated pending actions
    this.savePendingActions();
  }
  
  // Process a message action
  private async processMessageAction(payload: any) {
    // Implementation for sending a message
    // await messageService.sendMessage(payload);
  }
  
  // Process a profile update action
  private async processProfileAction(payload: any) {
    // Implementation for updating profile
    // await profileService.updateProfile(payload);
  }
}

export const offlineSyncService = new OfflineSyncService();
```

## 3. Redux State Management Implementation

### Auth Slice Implementation

```typescript
// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../../services/api.client';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      // Store tokens
      await AsyncStorage.setItem('accessToken', response.accessToken);
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      
      // Store tokens
      await AsyncStorage.setItem('accessToken', response.accessToken);
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Call logout endpoint
      await apiClient.post('/auth/logout');
      
      // Clear tokens
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      
      return null;
    } catch (error: any) {
      // Still remove tokens even if API call fails
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        return null;
      }
      
      // Get current user profile
      const user = await apiClient.get('/user/profile');
      return { user, token };
    } catch (error: any) {
      // Clear tokens if validation fails
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      
      return rejectWithValue(error.response?.data?.message || 'Authentication check failed');
    }
  }
);

// Create slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Register
    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(register.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
    });
    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    });
    
    // Check auth status
    builder.addCase(checkAuthStatus.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(checkAuthStatus.fulfilled, (state, action) => {
      state.isLoading = false;
      if (action.payload) {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      } else {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      }
    });
    builder.addCase(checkAuthStatus.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    });
  },
});

export const { setCredentials, updateUser, clearCredentials } = authSlice.actions;

export default authSlice.reducer;
```

### Matching Slice Implementation

```typescript
// src/store/slices/matchingSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api.client';

interface MatchState {
  potentialMatches: Array<any>;
  matches: Array<any>;
  isLoading: boolean;
  error: string | null;
  currentIndex: number;
}

const initialState: MatchState = {
  potentialMatches: [],
  matches: [],
  isLoading: false,
  error: null,
  currentIndex: 0,
};

// Async thunks
export const fetchPotentialMatches = createAsyncThunk(
  'matching/fetchPotential',
  async (_, { rejectWithValue }) => {
    try {
      return await apiClient.get('/matching/potential');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch potential matches');
    }
  }
);

export const fetchMatches = createAsyncThunk(
  'matching/fetchMatches',
  async (_, { rejectWithValue }) => {
    try {
      return await apiClient.get('/matching/matches');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch matches');
    }
  }
);

export const swipeProfile = createAsyncThunk(
  'matching/swipe',
  async ({ userId, direction, isSuperLike = false }: { userId: string; direction: 'left' | 'right' | 'up'; isSuperLike: boolean }, { rejectWithValue }) => {
    try {
      return await apiClient.post('/matching/swipe', { userId, direction, isSuperLike });
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Swipe action failed');
    }
  }
);

// Create slice
const matchingSlice = createSlice({
  name: 'matching',
  initialState,
  reducers: {
    nextProfile: (state) => {
      if (state.currentIndex < state.potentialMatches.length - 1) {
        state.currentIndex += 1;
      }
    },
    resetIndex: (state) => {
      state.currentIndex = 0;
    },
    addMatch: (state, action) => {
      const exists = state.matches.some(match => match.id === action.payload.id);
      if (!exists) {
        state.matches.unshift(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch potential matches
    builder.addCase(fetchPotentialMatches.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchPotentialMatches.fulfilled, (state, action) => {
      state.isLoading = false;
      state.potentialMatches = action.payload;
      state.currentIndex = 0;
    });
    builder.addCase(fetchPotentialMatches.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Fetch matches
    builder.addCase(fetchMatches.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMatches.fulfilled, (state, action) => {
      state.isLoading = false;
      state.matches = action.payload;
    });
    builder.addCase(fetchMatches.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Swipe profile
    builder.addCase(swipeProfile.fulfilled, (state, action) => {
      // If there was a match, add it to matches array
      if (action.payload?.match) {
        const exists = state.matches.some(match => match.id === action.payload.match.id);
        if (!exists) {
          state.matches.unshift(action.payload.match);
        }
      }
    });
  },
});

export const { nextProfile, resetIndex, addMatch } = matchingSlice.actions;

export default matchingSlice.reducer;
```

### Messaging Slice Implementation

```typescript
// src/store/slices/messagingSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api.client';
import { offlineSyncService } from '../../services/offline-sync.service';
import NetInfo from '@react-native-community/netinfo';

interface MessagingState {
  conversations: Array<any>;
  messages: Record<string, Array<any>>;
  isLoading: boolean;
  error: string | null;
  unreadCounts: Record<string, number>;
}

const initialState: MessagingState = {
  conversations: [],
  messages: {},
  isLoading: false,
  error: null,
  unreadCounts: {},
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  'messaging/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      return await apiClient.get('/messaging/conversations');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messaging/fetchMessages',
  async (matchId: string, { rejectWithValue }) => {
    try {
      const messages = await apiClient.get(`/messaging/messages/${matchId}`);
      return { matchId, messages };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messaging/sendMessage',
  async ({ matchId, content, mediaUrl }: { matchId: string; content: string; mediaUrl?: string }, { rejectWithValue }) => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      
      if (!netInfo.isConnected) {
        // Queue for offline processing
        const offlineAction = offlineSyncService.queueAction('SEND_MESSAGE', { matchId, content, mediaUrl });
        
        // Return optimistic result
        return {
          id: `offline-${Date.now()}`,
          matchId,
          content,
          mediaUrl,
          senderId: 'currentUser', // Will be replaced when synced
          timestamp: new Date().toISOString(),
          status: 'pending',
          isOffline: true,
          offlineId: offlineAction.timestamp,
        };
      }
      
      // Online - send directly
      return await apiClient.post('/messaging/messages', { matchId, content, mediaUrl });
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const markConversationAsRead = createAsyncThunk(
  'messaging/markAsRead',
  async (matchId: string, { rejectWithValue }) => {
    try {
      await apiClient.post(`/messaging/read/${matchId}`);
      return matchId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark conversation as read');
    }
  }
);

// Create slice
const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const { matchId, message } = action.payload;
      
      if (!state.messages[matchId]) {
        state.messages[matchId] = [];
      }
      
      // Check if message already exists
      const messageExists = state.messages[matchId].some(m => m.id === message.id);
      
      if (!messageExists) {
        state.messages[matchId].push(message);
        
        // Update unread count if the message is from someone else
        if (message.senderId !== 'currentUser') {
          state.unreadCounts[matchId] = (state.unreadCounts[matchId] || 0) + 1;
        }
        
        // Update latest message in conversations
        const conversationIndex = state.conversations.findIndex(c => c.matchId === matchId);
        if (conversationIndex >= 0) {
          state.conversations[conversationIndex].latestMessage = message;
          
          // Move conversation to top
          const conversation = state.conversations[conversationIndex];
          state.conversations.splice(conversationIndex, 1);
          state.conversations.unshift(conversation);
        }
      }
    },
    updateMessageStatus: (state, action) => {
      const { matchId, messageId, status } = action.payload;
      
      if (state.messages[matchId]) {
        const messageIndex = state.messages[matchId].findIndex(m => m.id === messageId);
        if (messageIndex >= 0) {
          state.messages[matchId][messageIndex].status = status;
        }
      }
    },
    resetUnreadCount: (state, action) => {
      const matchId = action.payload;
      state.unreadCounts[matchId] = 0;
    },
  },
  extraReducers: (builder) => {
    // Fetch conversations
    builder.addCase(fetchConversations.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchConversations.fulfilled, (state, action) => {
      state.isLoading = false;
      state.conversations = action.payload;
    });
    builder.addCase(fetchConversations.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Fetch messages
    builder.addCase(fetchMessages.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      state.isLoading = false;
      state.messages[action.payload.matchId] = action.payload.messages;
    });
    builder.addCase(fetchMessages.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // Send message
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      const message = action.payload;
      const matchId = message.matchId;
      
      if (!state.messages[matchId]) {
        state.messages[matchId] = [];
      }
      
      // Replace offline message if exists
      if (message.isOffline) {
        state.messages[matchId].push(message);
      } else {
        // Remove any offline version of this message if it exists
        const offlineIndex = state.messages[matchId].findIndex(m => 
          m.isOffline && m.content === message.content
        );
        
        if (offlineIndex >= 0) {
          state.messages[matchId].splice(offlineIndex, 1);
        }
        
        state.messages[matchId].push(message);
      }
      
      // Update conversation
      const conversationIndex = state.conversations.findIndex(c => c.matchId === matchId);
      if (conversationIndex >= 0) {
        state.conversations[conversationIndex].latestMessage = message;
        
        // Move conversation to top
        const conversation = state.conversations[conversationIndex];
        state.conversations.splice(conversationIndex, 1);
        state.conversations.unshift(conversation);
      }
    });
    
    // Mark as read
    builder.addCase(markConversationAsRead.fulfilled, (state, action) => {
      const matchId = action.payload;
      state.unreadCounts[matchId] = 0;
    });
  },
});

export const { addMessage, updateMessageStatus, resetUnreadCount } = messagingSlice.actions;

export default messagingSlice.reducer;
```

## 4. Comprehensive End-to-End Testing

Building on the E2E testing examples in `production-readiness-steps.md`, here are additional critical test cases:

### Authentication Flow Tests

```javascript
// e2e/authentication.test.js (expanded)

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });
  
  it('should display error message with wrong credentials', async () => {
    await element(by.id('email-input')).typeText('wrong@example.com');
    await element(by.id('password-input')).typeText('wrongpassword');
    await element(by.text('Log In')).tap();
    
    await waitFor(element(by.text('Invalid email or password'))).toBeVisible().withTimeout(2000);
  });
  
  it('should validate email format', async () => {
    await element(by.id('email-input')).typeText('invalid-email');
    await element(by.id('password-input')).typeText('password123');
    await element(by.text('Log In')).tap();
    
    await waitFor(element(by.text('Please enter a valid email address'))).toBeVisible().withTimeout(2000);
  });
  
  it('should handle password reset flow', async () => {
    await element(by.text('Forgot Password?')).tap();
    await element(by.id('reset-email-input')).typeText('test@example.com');
    await element(by.text('Send Reset Link')).tap();
    
    await waitFor(element(by.text('Password reset email sent'))).toBeVisible().withTimeout(2000);
  });
});
```

### Matching Flow Tests

```javascript
// e2e/matching.test.js

describe('Matching Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Log in before tests
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.text('Log In')).tap();
    
    // Wait for home screen to load
    await waitFor(element(by.text('Discover'))).toBeVisible().withTimeout(5000);
  });
  
  beforeEach(async () => {
    // Navigate to Discover tab if not already there
    if (!(await element(by.id('discover-screen')).isVisible())) {
      await element(by.id('tab-discover')).tap();
    }
  });
  
  it('should display profile cards and allow swiping', async () => {
    // Verify profile elements are visible
    await expect(element(by.id('profile-card'))).toBeVisible();
    await expect(element(by.id('profile-name'))).toBeVisible();
    
    // Swipe left (pass)
    await element(by.id('profile-card')).swipe('left');
    
    // Wait for next card to appear
    await waitFor(element(by.id('profile-card'))).toBeVisible().withTimeout(2000);
    
    // Verify it's a different profile
    const firstProfileName = await element(by.id('profile-name')).getText();
    
    // Swipe right (like)
    await element(by.id('profile-card')).swipe('right');
    
    // Wait for next card to appear
    await waitFor(element(by.id('profile-card'))).toBeVisible().withTimeout(2000);
    
    // Verify it's a different profile
    const secondProfileName = await element(by.id('profile-name')).getText();
    expect(firstProfileName).not.toEqual(secondProfileName);
  });
  
  it('should show match animation when mutual like occurs', async () => {
    // Mock a match scenario (this depends on your testing approach)
    // For example, use a specific test user that will always match
    
    // Swipe right on pre-configured profile that will match
    await element(by.id('profile-card')).swipe('right');
    
    // Verify match screen appears
    await waitFor(element(by.id('match-animation'))).toBeVisible().withTimeout(5000);
    await expect(element(by.text("It's a Match!"))).toBeVisible();
    
    // Tap "Keep Swiping" to dismiss
    await element(by.text('Keep Swiping')).tap();
    
    // Verify back on discover screen
    await expect(element(by.id('discover-screen'))).toBeVisible();
  });
});
```

### Messaging Flow Tests

```javascript
// e2e/messaging.test.js

describe('Messaging Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Log in before tests
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.text('Log In')).tap();
    
    // Wait for home screen to load
    await waitFor(element(by.text('Discover'))).toBeVisible().withTimeout(5000);
  });
  
  beforeEach(async () => {
    // Navigate to Messages tab
    await element(by.id('tab-messages')).tap();
    await waitFor(element(by.id('conversations-list'))).toBeVisible().withTimeout(2000);
  });
  
  it('should display conversations list', async () => {
    await expect(element(by.id('conversations-list'))).toBeVisible();
    // Verify at least one conversation exists (set up test
