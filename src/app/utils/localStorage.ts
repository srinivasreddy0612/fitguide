import { useUser } from '@clerk/nextjs';

const getUserPrefix = (userId: string | null): string => {
  if (!userId) {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const potentialUserId = pathParts.length > 1 ? pathParts[1] : null;
      
      if (potentialUserId && potentialUserId.length > 8) {
        userId = potentialUserId;
      } else {
        const sessionId = sessionStorage.getItem('userSessionId');
        if (sessionId) {
          userId = sessionId;
        } else {
          const tempId = 'temp_' + Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('userSessionId', tempId);
          userId = tempId;
        }
      }
    } else {
      userId = 'default';
    }
  }
  
  return `user_${userId}_`;
};

export const setItem = (key: string, value: any, userId: string | null = null): boolean => {
  if (typeof window === 'undefined') return false;
  
  const prefix = getUserPrefix(userId);
  const prefixedKey = prefix + key;
  
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(prefixedKey, serializedValue);
    
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

export const getItem = (key: string, userId: string | null = null): any => {
    if (typeof window === 'undefined') return null;
    
    const prefix = getUserPrefix(userId);
    const prefixedKey = prefix + key;
    
    try {
      const serializedValue = localStorage.getItem(prefixedKey);
      
      if (serializedValue === null) {
        if (userId) {
          console.log(`Item ${key} not found with user prefix, trying without prefix`);
          if (key === 'initialWorkoutPlan' || key === 'onboardingComplete') {
            const unprefixedValue = localStorage.getItem(key);
            if (unprefixedValue !== null) {
              console.log(`Found item ${key} without prefix, will migrate to user-specific storage`);
              try {
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
        
        if (
          key === 'initialWorkoutPlan' || key === 'customWorkouts' || 
          key === 'dietPlans' || key === 'workoutHistory' || key === 'dietHistory'
        ) {
          return [];
        }
        
        return serializedValue;
      }
    } catch (error) {
      console.error(`Error retrieving ${prefixedKey} from localStorage:`, error);
      
      if (
        key === 'initialWorkoutPlan' || key === 'customWorkouts' || 
        key === 'dietPlans' || key === 'workoutHistory' || key === 'dietHistory'
      ) {
        return [];
      }
      
      return null;
    }
  };

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

export const removeItem = (key: string, userId: string | null = null): void => {
  if (typeof window === 'undefined') return;
  
  const prefix = getUserPrefix(userId);
  const prefixedKey = prefix + key;
  
  try {
    localStorage.removeItem(prefixedKey);
    
    if (key === 'onboardingComplete' && userId) {
      document.cookie = `user_${userId}_onboardingComplete=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

export const clearUserData = (userId: string | null = null): void => {
  if (typeof window === 'undefined') return;
  
  const prefix = getUserPrefix(userId);
  
  try {
    const allKeys = Object.keys(localStorage);
    
    const userKeys = allKeys.filter(key => key.startsWith(prefix));
    
    userKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    if (userId) {
      document.cookie = `user_${userId}_onboardingComplete=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  } catch (error) {
    console.error('Error clearing user data from localStorage:', error);
  }
};

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

export const hasCompletedOnboarding = async (userId: string | null = null): Promise<boolean> => {
    if (!userId) {
      return checkLocalOnboarding(userId);
    }
    
    try {
      const response = await fetch('/api/mongodb-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'fetch'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (
          (data.workouts && data.workouts.length > 0) || 
          (data.dietPlans && data.dietPlans.length > 0) ||
          data.preferences
        ) {
          return true;
        }
      }
    } catch (error) {
      console.error('Error checking MongoDB for onboarding status:', error);
    }
    
    return checkLocalOnboarding(userId);
  };
  
  export const checkLocalOnboarding = (userId: string | null = null): boolean => {
    if (typeof window === 'undefined') return false;
    
    try {
      const onboardingCompleteInStorage = getItem('onboardingComplete', userId) === 'true';
      if (onboardingCompleteInStorage) return true;
      
      const hasInitialPlan = getItem('initialWorkoutPlan', userId) !== null;
      const hasCustomWorkouts = getItem('customWorkouts', userId) !== null 
                             && Array.isArray(getItem('customWorkouts', userId)) 
                             && getItem('customWorkouts', userId).length > 0;
      if (hasInitialPlan || hasCustomWorkouts) return true;
      
      if (userId) {
        const userCookieRegex = new RegExp(`user_${userId}_onboardingComplete=true`);
        if (userCookieRegex.test(document.cookie)) return true;
      }
      
      const generalCookieRegex = /onboardingComplete=true/;
      if (generalCookieRegex.test(document.cookie)) return true;
      
      return false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  };