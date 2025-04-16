// utils/localStorage.ts
import { useUser } from '@clerk/nextjs';

/**
 * Helper functions to store data in localStorage with user isolation
 * This ensures that each user has their own data and can't see other users' data
 */

// Get the current user ID
const getUserPrefix = (userId: string | null): string => {
  // If no userId is provided, try to get it from the URL or a default
  if (!userId) {
    // In case we're on the client side and can access window
    if (typeof window !== 'undefined') {
      // Try to extract from URL if we're in an authenticated route
      const pathParts = window.location.pathname.split('/');
      const potentialUserId = pathParts.length > 1 ? pathParts[1] : null;
      
      // Check if it's a valid user ID format (simplified check)
      if (potentialUserId && potentialUserId.length > 8) {
        userId = potentialUserId;
      } else {
        // Use a session ID if available
        const sessionId = sessionStorage.getItem('userSessionId');
        if (sessionId) {
          userId = sessionId;
        } else {
          // Generate a temporary ID and store in session
          const tempId = 'temp_' + Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('userSessionId', tempId);
          userId = tempId;
        }
      }
    } else {
      // Fallback for server-side
      userId = 'default';
    }
  }
  
  return `user_${userId}_`;
};

// Set an item in localStorage with user prefix
export const setItem = (key: string, value: any, userId: string | null = null): boolean => {
  if (typeof window === 'undefined') return false;
  
  const prefix = getUserPrefix(userId);
  const prefixedKey = prefix + key;
  
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(prefixedKey, serializedValue);
    
    // If this is the onboardingComplete flag, also set a user-specific cookie
    if (key === 'onboardingComplete' && userId) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days
      document.cookie = `user_${userId}_onboardingComplete=${value}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

// Get an item from localStorage with user prefix
// Updated getItem function for localStorage.ts

// Get an item from localStorage with user prefix
export const getItem = (key: string, userId: string | null = null): any => {
    if (typeof window === 'undefined') return null;
    
    const prefix = getUserPrefix(userId);
    const prefixedKey = prefix + key;
    
    try {
      const serializedValue = localStorage.getItem(prefixedKey);
      
      if (serializedValue === null) {
        // Item not found with user prefix, try without prefix (for backward compatibility)
        if (userId) {
          console.log(`Item ${key} not found with user prefix, trying without prefix`);
          // Only do this fallback for crucial keys like initialWorkoutPlan
          if (key === 'initialWorkoutPlan' || key === 'onboardingComplete') {
            const unprefixedValue = localStorage.getItem(key);
            if (unprefixedValue !== null) {
              console.log(`Found item ${key} without prefix, will migrate to user-specific storage`);
              try {
                // Parse and then immediately save with the user prefix for future use
                const parsedValue = JSON.parse(unprefixedValue);
                setItem(key, parsedValue, userId);
                return parsedValue;
              } catch (parseError) {
                console.error(`Error parsing unprefixed item ${key}:`, parseError);
              }
            }
          }
        }
        return null;
      }
      
      try {
        const parsedValue = JSON.parse(serializedValue);
        
        // Extra validation for arrays - ensure we return empty array instead of null
        if (
          (key === 'initialWorkoutPlan' || key === 'customWorkouts' || 
           key === 'dietPlans' || key === 'workoutHistory' || key === 'dietHistory') && 
          parsedValue === null
        ) {
          return [];
        }
        
        return parsedValue;
      } catch (parseError) {
        console.error(`Error parsing item ${prefixedKey}:`, parseError);
        
        // For critical arrays, return empty array on parse error
        if (
          key === 'initialWorkoutPlan' || key === 'customWorkouts' || 
          key === 'dietPlans' || key === 'workoutHistory' || key === 'dietHistory'
        ) {
          return [];
        }
        
        // For everything else, return the raw value
        return serializedValue;
      }
    } catch (error) {
      console.error(`Error retrieving ${prefixedKey} from localStorage:`, error);
      
      // For critical arrays, return empty array on error
      if (
        key === 'initialWorkoutPlan' || key === 'customWorkouts' || 
        key === 'dietPlans' || key === 'workoutHistory' || key === 'dietHistory'
      ) {
        return [];
      }
      
      return null;
    }
  };

// Check if an item exists in localStorage with user prefix
export const hasItem = (key: string, userId: string | null = null): boolean => {
  if (typeof window === 'undefined') return false;
  
  const prefix = getUserPrefix(userId);
  const prefixedKey = prefix + key;
  
  try {
    return localStorage.getItem(prefixedKey) !== null;
  } catch (error) {
    console.error('Error checking localStorage item:', error);
    return false;
  }
};

// Remove an item from localStorage with user prefix
export const removeItem = (key: string, userId: string | null = null): void => {
  if (typeof window === 'undefined') return;
  
  const prefix = getUserPrefix(userId);
  const prefixedKey = prefix + key;
  
  try {
    localStorage.removeItem(prefixedKey);
    
    // If this is the onboardingComplete flag, also remove the user-specific cookie
    if (key === 'onboardingComplete' && userId) {
      document.cookie = `user_${userId}_onboardingComplete=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Clear all items for a specific user
export const clearUserData = (userId: string | null = null): void => {
  if (typeof window === 'undefined') return;
  
  const prefix = getUserPrefix(userId);
  
  try {
    // Get all keys from localStorage
    const allKeys = Object.keys(localStorage);
    
    // Filter keys that belong to the user
    const userKeys = allKeys.filter(key => key.startsWith(prefix));
    
    // Remove each key
    userKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also remove user-specific cookies
    if (userId) {
      document.cookie = `user_${userId}_onboardingComplete=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  } catch (error) {
    console.error('Error clearing user data from localStorage:', error);
  }
};

// Hook for using localStorage with user isolation in components
export const useLocalStorage = () => {
  const { user } = useUser();
  const userId = user?.id;
  
  return {
    getItem: (key: string) => getItem(key, userId),
    setItem: (key: string, value: any) => setItem(key, value, userId),
    hasItem: (key: string) => hasItem(key, userId),
    removeItem: (key: string) => removeItem(key, userId),
    clearUserData: () => clearUserData(userId)
  };
};

// Check if a user has completed onboarding
export const hasCompletedOnboarding = (userId: string | null = null): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check localStorage first
    const onboardingCompleteInStorage = getItem('onboardingComplete', userId) === 'true';
    if (onboardingCompleteInStorage) return true;
    
    // Check if the user has workout plans
    const hasInitialPlan = getItem('initialWorkoutPlan', userId) !== null;
    const hasCustomWorkouts = getItem('customWorkouts', userId) !== null 
                           && Array.isArray(getItem('customWorkouts', userId)) 
                           && getItem('customWorkouts', userId).length > 0;
    if (hasInitialPlan || hasCustomWorkouts) return true;
    
    // Check for user-specific cookie
    if (userId) {
      const userCookieRegex = new RegExp(`user_${userId}_onboardingComplete=true`);
      if (userCookieRegex.test(document.cookie)) return true;
    }
    
    // Also check general cookie (for backward compatibility)
    const generalCookieRegex = /onboardingComplete=true/;
    if (generalCookieRegex.test(document.cookie)) return true;
    
    return false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};