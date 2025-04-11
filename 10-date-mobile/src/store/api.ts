/**
 * API Service Configuration using RTK Query
 * 
 * This file sets up the API service with endpoints for interacting
 * with the backend server, including automatic token refresh.
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '../config';
import AuthService from '../services/auth.service';
import { RootState } from './index';

// Base query with auth token
const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: async (headers, { getState }) => {
    // Get token from state
    const token = (getState() as RootState).auth.token;
    
    // If token exists, add to headers
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

// Wrapped base query with token refresh logic
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Handle 401 Unauthorized errors (token expired)
  if (result.error && 'status' in result.error && result.error.status === 401) {
    // Try to get a new token
    const refreshToken = await AuthService.getRefreshToken();
    
    if (refreshToken) {
      try {
        // Attempt token refresh
        const refreshResult = await AuthService.login({ refreshToken });
        
        if (refreshResult) {
          // Store the new token
          api.dispatch({ 
            type: 'auth/setCredentials', 
            payload: { 
              token: refreshResult.accessToken,
              user: null // To be replaced with actual user data if needed
            } 
          });
          
          // Retry the original request
          result = await baseQuery(args, api, extraOptions);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }
  }
  
  return result;
};

// Define API service
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Match', 'Message', 'Profile', 'Subscription'],
  endpoints: (builder) => ({
    // User endpoints
    getProfile: builder.query({
      query: () => 'user/profile',
      providesTags: ['User', 'Profile'],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: 'user/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User', 'Profile'],
    }),
    
    // Matching endpoints
    getPotentialMatches: builder.query({
      query: (params) => ({
        url: 'matching/potential',
        params,
      }),
      providesTags: ['Match'],
    }),
    
    // New recommendation endpoint with enhanced AI matching
    getRecommendations: builder.query({
      query: ({ userId, limit = 10, includeDetails = true }) => ({
        url: `matching/recommendations/${userId}`,
        params: { limit, includeDetails }
      }),
      providesTags: ['Match'],
    }),
    
    // New endpoint to get detailed match factors between users
    getMatchFactors: builder.query({
      query: ({ userId, targetUserId }) => 
        `matching/match-factors/${userId}/${targetUserId}`,
      providesTags: (result, error, { userId, targetUserId }) => 
        [{ type: 'Match', id: `${userId}-${targetUserId}` }],
    }),
    
    // Enhanced swipe endpoint that includes behavioral data
    swipeProfile: builder.mutation({
      query: ({ userId, targetUserId, direction, metadata }) => ({
        url: 'matching/swipe',
        method: 'POST',
        body: { 
          userId, 
          targetUserId, 
          direction,
          metadata, // Behavioral data (swipe time, view duration, etc.)
        },
      }),
      invalidatesTags: ['Match'],
    }),
    
    getMatches: builder.query({
      query: () => 'matching/matches',
      providesTags: ['Match'],
    }),
    
    // Messaging endpoints
    getConversations: builder.query({
      query: () => 'messaging/conversations',
      providesTags: ['Message'],
    }),
    getMessages: builder.query({
      query: (matchId) => `messaging/conversations/${matchId}`,
      providesTags: (result, error, matchId) => [{ type: 'Message', id: matchId }],
    }),
    sendMessage: builder.mutation({
      query: ({ matchId, content, mediaType, mediaUrl }) => ({
        url: `messaging/conversations/${matchId}`,
        method: 'POST',
        body: { content, mediaType, mediaUrl },
      }),
      invalidatesTags: (result, error, { matchId }) => [{ type: 'Message', id: matchId }],
    }),
    
    // Subscription endpoints
    getSubscriptionPlans: builder.query({
      query: () => 'subscription/plans',
      providesTags: ['Subscription'],
    }),
    getCurrentSubscription: builder.query({
      query: () => 'subscription/current',
      providesTags: ['Subscription'],
    }),
    
    // Preferences endpoints
    getPreferences: builder.query({
      query: () => 'user/preferences',
      providesTags: ['User'],
    }),
    updatePreferences: builder.mutation({
      query: (data) => ({
        url: 'user/preferences',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

// Export hooks
export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetPotentialMatchesQuery,
  useGetRecommendationsQuery, // New hook for enhanced recommendations
  useGetMatchFactorsQuery, // New hook for match factors
  useSwipeProfileMutation,
  useGetMatchesQuery,
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetSubscriptionPlansQuery,
  useGetCurrentSubscriptionQuery,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
} = api;
