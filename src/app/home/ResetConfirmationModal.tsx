"use client"
import React from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

// Import our localStorage helper
import { removeItem, clearUserData } from '../utils/localStorage';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResetConfirmationModal: React.FC<ResetConfirmationModalProps> = ({ 
  isOpen,
  onClose
}) => {
  const router = useRouter();
  const { user } = useUser();

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  // Function to clear data and start onboarding
  const handleReset = async () => {
    if (!user) {
      onClose();
      return;
    }
    
    try {
      // First, reset data in MongoDB to prevent duplicate keys on reload
      const response = await fetch('/api/mongodb-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          dataType: 'all', // Reset all data except history
          action: 'reset'
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to reset MongoDB data');
      } else {
        console.log('✅ MongoDB data reset successful');
      }
    } catch (error) {
      console.error('Error resetting MongoDB data:', error);
    }
    
    // Clear local storage data
    if (user) {
      // Clear only workout related data from localStorage, preserving user-specific isolation
      removeItem('initialWorkoutPlan', user.id);
      removeItem('customWorkouts', user.id);
      removeItem('onboardingComplete', user.id);
      removeItem('dietPlans', user.id);
      
      // Alternatively, to clear ALL data for the user:
      // clearUserData(user.id);
    } else {
      // If no user context available, try to clear with default handling
      removeItem('initialWorkoutPlan');
      removeItem('customWorkouts');
      removeItem('onboardingComplete');
    }
    
    // Clear the cookie
    document.cookie = 'onboardingComplete=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    
    // Navigate to onboarding
    router.push('/onboarding');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white/10 backdrop-blur-xl rounded-xl max-w-md w-full border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 mr-3">
              <RefreshCw size={20} />
            </div>
            <h2 className="text-xl font-medium text-white/90">Reset Workout Plan</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 bg-black/20 backdrop-blur-sm rounded-full p-1.5 hover:bg-black/30 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Modal body */}
        <div className="p-6">
          <p className="text-white/70 mb-4">
            Are you sure you want to reset your workout plan? This will:
          </p>
          <ul className="space-y-2 mb-6 text-white/60 text-sm">
            <li className="flex items-start">
              <span className="inline-block w-5 text-white/40 flex-shrink-0">•</span>
              <span>Delete your current workout plan</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-5 text-white/40 flex-shrink-0">•</span>
              <span>Remove any custom workouts you've created</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-5 text-white/40 flex-shrink-0">•</span>
              <span>Take you through the onboarding process again</span>
            </li>
          </ul>
          <p className="text-white/70 mb-6">
            <strong>Note:</strong> Your workout history will be preserved.
          </p>
          
          <div className="flex space-x-3">
            <button 
              className="flex-1 bg-white/5 hover:bg-white/10 backdrop-blur-sm py-2.5 rounded-lg font-medium transition-all text-sm text-white/70 border border-white/5"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="flex-1 bg-red-500/10 hover:bg-red-500/20 backdrop-blur-sm py-2.5 rounded-lg font-medium transition-all text-sm text-red-400 border border-red-500/20"
              onClick={handleReset}
            >
              Reset Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetConfirmationModal;