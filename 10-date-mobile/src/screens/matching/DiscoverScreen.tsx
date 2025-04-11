/**
 * Discover Screen Component
 * 
 * The main matching interface where users can swipe left/right on potential matches.
 * Includes card stack UI, swipe gestures, and match animations.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store';
import { useGetRecommendationsQuery, useSwipeProfileMutation, useGetMatchFactorsQuery } from '../../store/api';
import { DiscoverScreenProps } from '../../types/navigation';
import { primaryColors, neutralColors, spacing, typography, shadows } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

// Get screen dimensions
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Swipe threshold - determines when a card is considered "swiped"
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

// Enhanced potential match data type
interface PotentialMatch {
  id: string;
  userId: string;
  name: string;
  age: number;
  distance: number;
  bio: string;
  interests: string[];
  photos: string[];
  verified: boolean;
  // New fields from AI matching
  compatibilityScore: number;
  commonInterests: string[];
}

const DiscoverScreen: React.FC<DiscoverScreenProps> = ({ navigation }) => {
  // User ID from auth state
  const { user } = useAppSelector(state => state.auth);
  const userId = user?.id;
  
  // State variables
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [matchAnimation, setMatchAnimation] = useState(false);
  const [matchedUser, setMatchedUser] = useState<PotentialMatch | null>(null);
  
  // State for tracking swipe behavior
  const [swipeStartTime, setSwipeStartTime] = useState<number | null>(null);
  const [viewStartTime, setViewStartTime] = useState<number>(Date.now());
  const [viewedSections, setViewedSections] = useState<string[]>([]);
  
  // RTK Query hook for fetching potential matches with AI recommendations
  const { 
    data: recommendations, 
    isLoading, 
    isError, 
    refetch 
  } = useGetRecommendationsQuery({
    userId,
    limit: 10,
    includeDetails: true
  }, {
    skip: !userId
  });
  
  // Mutation hook for swiping (like/pass)
  const [swipeProfile, { isLoading: isSwipeLoading }] = useSwipeProfileMutation();
  
  // Animation values
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  
  // Pan responder for handling swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Record start time when user begins to interact with a profile
        setSwipeStartTime(Date.now());
      },
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
          setSwipeStartTime(null); // Reset if not a full swipe
        }
      },
    })
  ).current;
  
  // Track when user views a new profile
  useEffect(() => {
    setViewStartTime(Date.now());
    setViewedSections([]);
  }, [currentIndex]);
  
  // Reset card position animation
  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: true,
    }).start();
  };
  
  // Record user viewing a specific section
  const recordSectionView = (section: string) => {
    if (!viewedSections.includes(section)) {
      setViewedSections(prev => [...prev, section]);
    }
  };
  
  // Collect behavioral data for swipe
  const collectSwipeMetadata = (direction: 'left' | 'right' | 'up') => {
    const endTime = Date.now();
    const swipeTime = swipeStartTime ? endTime - swipeStartTime : 0;
    const profileViewDuration = endTime - viewStartTime;
    
    return {
      swipeTime,
      profileViewDuration,
      viewedSections,
      direction
    };
  };
  
  // Swipe right (like) animation and logic
  const swipeRight = async () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(async () => {
      await handleSwipe('right');
      position.setValue({ x: 0, y: 0 });
    });
  };
  
  // Swipe left (pass) animation and logic
  const swipeLeft = async () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(async () => {
      await handleSwipe('left');
      position.setValue({ x: 0, y: 0 });
    });
  };
  
  // Super like animation and logic
  const superLike = async () => {
    Animated.timing(position, {
      toValue: { x: 0, y: -SCREEN_HEIGHT - 100 },
      duration: 250,
      useNativeDriver: true,
    }).start(async () => {
      await handleSwipe('up', true);
      position.setValue({ x: 0, y: 0 });
    });
  };
  
  // Handle swipe API call
  const handleSwipe = async (direction: 'left' | 'right' | 'up', isSuperLike: boolean = false) => {
    if (!recommendations || recommendations.length <= currentIndex || !userId) return;
    
    const currentProfile = recommendations[currentIndex];
    const metadata = collectSwipeMetadata(direction);
    
    try {
      const result = await swipeProfile({
        userId,
        targetUserId: currentProfile.userId,
        direction,
        isSuperLike,
        metadata
      }).unwrap();
      
      // Handle match result
      if (result.match) {
        setMatchedUser(currentProfile);
        setMatchAnimation(true);
      }
      
      // Reset tracking data and move to next profile
      setSwipeStartTime(null);
      setCurrentIndex(prevIndex => prevIndex + 1);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while processing your swipe');
    }
  };
  
  // Refresh profiles when reaching the end
  useEffect(() => {
    if (recommendations && currentIndex >= recommendations.length - 2) {
      setIsRefreshing(true);
      refetch().finally(() => setIsRefreshing(false));
    }
  }, [currentIndex, recommendations, refetch]);
  
  // Get card rotation and opacity styles based on position
  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['-10deg', '0deg', '10deg'],
      extrapolate: 'clamp',
    });
    
    return {
      transform: [
        { translateX: position.x },
        { translateY: position.y },
        { rotate },
      ],
    };
  };
  
  // Render like/pass overlays based on swipe direction
  const renderOverlays = (index: number) => {
    if (index !== currentIndex) return null;
    
    const likeOpacity = position.x.interpolate({
      inputRange: [0, SCREEN_WIDTH / 4],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    
    const passOpacity = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 4, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    
    const superLikeOpacity = position.y.interpolate({
      inputRange: [-SCREEN_HEIGHT / 4, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    
    return (
      <>
        <Animated.View
          style={[
            styles.overlayContainer,
            styles.likeOverlay,
            { opacity: likeOpacity },
          ]}
        >
          <Text style={styles.overlayText}>LIKE</Text>
        </Animated.View>
        
        <Animated.View
          style={[
            styles.overlayContainer,
            styles.passOverlay,
            { opacity: passOpacity },
          ]}
        >
          <Text style={styles.overlayText}>PASS</Text>
        </Animated.View>
        
        <Animated.View
          style={[
            styles.overlayContainer,
            styles.superlikeOverlay,
            { opacity: superLikeOpacity },
          ]}
        >
          <Text style={styles.overlayText}>SUPER LIKE</Text>
        </Animated.View>
      </>
    );
  };
  
  // Render compatibility badge
  const renderCompatibilityBadge = (score: number) => (
    <View style={styles.compatibilityBadge}>
      <Text style={styles.compatibilityText}>{score}% Match</Text>
    </View>
  );
  
  // Render profile card
  const renderCard = (profile: PotentialMatch, index: number) => {
    // Only render cards that are currentIndex or next in stack (for performance)
    if (index < currentIndex || index > currentIndex + 2) return null;
    
    // Apply different styles based on card position in stack
    const isCurrentCard = index === currentIndex;
    const isNextCard = index === currentIndex + 1;
    const isThirdCard = index === currentIndex + 2;
    
    const cardStyle = isCurrentCard
      ? [styles.card, getCardStyle()]
      : [
          styles.card,
          {
            transform: [
              { scale: isNextCard ? 0.95 : 0.9 },
              { translateY: isNextCard ? 10 : 20 },
            ],
            opacity: isNextCard ? 0.8 : 0.6,
          },
        ];
    
    return (
      <Animated.View
        key={profile.id}
        style={cardStyle}
        {...(isCurrentCard ? panResponder.panHandlers : {})}
      >
        <Image
          source={{ uri: profile.photos[0] }}
          style={styles.cardImage}
          onLoad={() => recordSectionView('photo')}
        />
        
        {/* Compatibility score badge */}
        {isCurrentCard && renderCompatibilityBadge(profile.compatibilityScore)}
        
        <View 
          style={styles.cardContent}
          onTouchStart={() => recordSectionView('content')}
        >
          <View style={styles.nameContainer}>
            <Text style={styles.nameText}>{profile.name}, {profile.age}</Text>
            {profile.verified && (
              <Ionicons name="checkmark-circle" size={24} color={primaryColors.primary} />
            )}
          </View>
          
          <Text style={styles.distanceText}>{profile.distance} miles away</Text>
          
          <Text 
            style={styles.bioText}
            onTouchStart={() => recordSectionView('bio')}
          >{profile.bio}</Text>
          
          {/* Common Interests Section */}
          {profile.commonInterests && profile.commonInterests.length > 0 && (
            <View 
              style={styles.commonInterestsContainer}
              onTouchStart={() => recordSectionView('commonInterests')}
            >
              <Text style={styles.commonInterestsTitle}>Common Interests</Text>
              <View style={styles.interestsContainer}>
                {profile.commonInterests.map((interest, i) => (
                  <View key={i} style={[styles.interestBadge, styles.commonInterestBadge]}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* All Interests Section */}
          <View 
            style={styles.interestsContainer}
            onTouchStart={() => recordSectionView('interests')}
          >
            <Text style={styles.interestsTitle}>Interests</Text>
            {profile.interests.map((interest, i) => (
              <View 
                key={i} 
                style={[
                  styles.interestBadge,
                  profile.commonInterests?.includes(interest) ? styles.commonInterestBadge : {}
                ]}
              >
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {renderOverlays(index)}
      </Animated.View>
    );
  };
  
  // Render action buttons
  const renderButtons = () => (
    <View style={styles.buttonsContainer}>
      <TouchableOpacity
        style={[styles.button, styles.passButton]}
        onPress={swipeLeft}
        disabled={isLoading || isSwipeLoading}
      >
        <Ionicons name="close" size={30} color={primaryColors.error} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.superLikeButton]}
        onPress={superLike}
        disabled={isLoading || isSwipeLoading}
      >
        <Ionicons name="star" size={25} color={primaryColors.secondary} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.likeButton]}
        onPress={swipeRight}
        disabled={isLoading || isSwipeLoading}
      >
        <Ionicons name="heart" size={30} color={primaryColors.primary} />
      </TouchableOpacity>
    </View>
  );
  
  // Render match animation overlay
  const renderMatchAnimation = () => {
    if (!matchAnimation || !matchedUser) return null;
    
    return (
      <View style={styles.matchAnimationContainer}>
        <View style={styles.matchContent}>
          <Text style={styles.matchText}>It's a Match!</Text>
          <Text style={styles.matchSubtext}>
            You and {matchedUser.name} have liked each other.
          </Text>
          
          <View style={styles.matchPhotosContainer}>
            <Image
              source={{ uri: "https://example.com/your-photo.jpg" }} // Replace with actual user photo
              style={styles.matchPhoto}
            />
            <Image
              source={{ uri: matchedUser.photos[0] }}
              style={styles.matchPhoto}
            />
          </View>
          
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => {
              setMatchAnimation(false);
              navigation.navigate('ChatDetail', {
                matchId: matchedUser.userId,
                userName: matchedUser.name,
              });
            }}
          >
            <Text style={styles.messageButtonText}>Send Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.keepSwipingButton}
            onPress={() => setMatchAnimation(false)}
          >
            <Text style={styles.keepSwipingText}>Keep Swiping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Render empty state (no more profiles)
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="search" size={80} color={neutralColors.gray400} />
      <Text style={styles.emptyStateTitle}>No More Profiles</Text>
      <Text style={styles.emptyStateText}>
        We're looking for more people in your area. Check back soon!
      </Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => refetch()}
        disabled={isLoading}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColors.primary} />
        <Text style={styles.loadingText}>Finding people near you...</Text>
      </View>
    );
  }
  
  // Render error state
  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={70} color={primaryColors.error} />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>
          We couldn't load profiles at this time. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Card stack */}
      {recommendations && recommendations.length > 0 ? (
        recommendations.map((profile, index) => renderCard(profile, index))
      ) : (
        renderEmptyState()
      )}
      
      {/* Action buttons */}
      {recommendations && 
       recommendations.length > 0 && 
       currentIndex < recommendations.length && 
       renderButtons()}
      
      {/* Match animation overlay */}
      {renderMatchAnimation()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutralColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.7,
    borderRadius: 20,
    backgroundColor: neutralColors.white,
    ...shadows.lg,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardContent: {
    padding: spacing.md,
    height: '40%',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nameText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: neutralColors.gray900,
    marginRight: spacing.xs,
  },
  distanceText: {
    fontSize: typography.fontSize.md,
    color: neutralColors.gray600,
    marginBottom: spacing.sm,
  },
  bioText: {
    fontSize: typography.fontSize.md,
    color: neutralColors.gray800,
    marginBottom: spacing.md,
  },
  interestsTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: neutralColors.gray800,
    marginBottom: spacing.xs,
  },
  commonInterestsTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: primaryColors.primary,
    marginBottom: spacing.xs,
  },
  commonInterestsContainer: {
    marginBottom: spacing.md,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  interestBadge: {
    backgroundColor: neutralColors.gray200,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 15,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  commonInterestBadge: {
    backgroundColor: primaryColors.primary + '20', // 20% opacity
    borderWidth: 1,
    borderColor: primaryColors.primary,
  },
  interestText: {
    fontSize: typography.fontSize.sm,
    color: neutralColors.gray800,
  },
  compatibilityBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    zIndex: 10,
  },
  compatibilityText: {
    color: neutralColors.white,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.md,
  },
  overlayContainer: {
    position: 'absolute',
    top: '15%',
    padding: spacing.sm,
    borderWidth: 3,
    borderRadius: 10,
    transform: [{ rotate: '30deg' }],
  },
  likeOverlay: {
    right: '10%',
    borderColor: primaryColors.primary,
  },
  passOverlay: {
    left: '10%',
    borderColor: primaryColors.error,
  },
  superlikeOverlay: {
    alignSelf: 'center',
    borderColor: primaryColors.secondary,
  },
  overlayText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: '10%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: neutralColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  passButton: {
    borderWidth: 1,
    borderColor: primaryColors.error,
  },
  likeButton: {
    borderWidth: 1,
    borderColor: primaryColors.primary,
  },
  superLikeButton: {
    borderWidth: 1,
    borderColor: primaryColors.secondary,
  },
  matchAnimationContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  matchContent: {
    width: '80%',
    backgroundColor: neutralColors.white,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
  },
  matchText: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: primaryColors.primary,
    marginBottom: spacing.sm,
  },
  matchSubtext: {
    fontSize: typography.fontSize.md,
    color: neutralColors.gray700,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  matchPhotosContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  matchPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    margin: spacing.sm,
    borderWidth: 2,
    borderColor: primaryColors.primary,
  },
  messageButton: {
    backgroundColor: primaryColors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 25,
    marginBottom: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  messageButtonText: {
    color: neutralColors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  keepSwipingButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  keepSwipingText: {
    color: neutralColors.gray600,
    fontSize: typography.fontSize.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: neutralColors.white,
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
    backgroundColor: neutralColors.white,
  },
  errorTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: neutralColors.gray900,
    marginVertical: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    color: neutralColors.gray700,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    backgroundColor: primaryColors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 25,
  },
  retryButtonText: {
    color: neutralColors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: neutralColors.gray900,
    marginVertical: spacing.md,
  },
  emptyStateText: {
    fontSize: typography.fontSize.md,
    color: neutralColors.gray700,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  refreshButton: {
    backgroundColor: primaryColors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: neutralColors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});

export default DiscoverScreen;
