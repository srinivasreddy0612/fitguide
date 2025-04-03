"use client"
import React, { useState } from 'react';
import { Apple, ChevronRight, Clock, Check, X } from 'lucide-react';

// Define interfaces for data types
interface Meal {
  id: number;
  mealType: string;
  title: string;
  description: string;
  ingredients: string[];
}

interface DietPlan {
  id: number | string;
  title: string;
  description: string;
  dietType: string;
  calorieRange: string;
  meals: Meal[];
  color: string;
  borderColor: string;
  iconColor: string;
  iconBg: string;
  icon?: React.ReactNode;
}

interface DietHistoryItem {
  id: number;
  date: string;
  mealName: string;
  dietPlanName: string;
  completed: boolean;
}

interface DietPlanComponentProps {
  showChatbot: boolean;
  dietPlans?: DietPlan[];
  setDietHistory?: React.Dispatch<React.SetStateAction<DietHistoryItem[]>>;
}

const DietPlanComponent: React.FC<DietPlanComponentProps> = ({
  showChatbot,
  dietPlans = [],
  setDietHistory
}) => {
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);
  const [completedMeals, setCompletedMeals] = useState<number[]>([]);

  // Function to open diet plan modal
  const openDietPlanModal = (plan: DietPlan) => {
    setSelectedPlan(plan);
    setCompletedMeals([]);
  };

  // Function to close diet plan modal
  const closeDietPlanModal = () => {
    setSelectedPlan(null);
  };

  // Function to toggle meal completion
  const toggleMeal = (mealId: number) => {
    setCompletedMeals(prev => {
      if (prev.includes(mealId)) {
        return prev.filter(id => id !== mealId);
      } else {
        return [...prev, mealId];
      }
    });
  };

  // Function to log completed meals
  const logMeals = () => {
    if (!selectedPlan || !setDietHistory) return;

    const today = new Date().toISOString().split('T')[0];
    const completedItems: DietHistoryItem[] = completedMeals.map(mealId => {
      const meal = selectedPlan.meals.find(m => m.id === mealId);
      return {
        id: Date.now() + mealId, // Ensure unique ID
        date: today,
        mealName: meal?.title || 'Unknown meal',
        dietPlanName: selectedPlan.title,
        completed: true
      };
    });

    if (completedItems.length > 0) {
      setDietHistory(prev => [...completedItems, ...prev]);
      
      // Store in localStorage
      try {
        const existingHistory = JSON.parse(localStorage.getItem('dietHistory') || '[]');
        localStorage.setItem('dietHistory', JSON.stringify([...completedItems, ...existingHistory]));
      } catch (error) {
        console.error('Error saving diet history to localStorage:', error);
      }
    }

    closeDietPlanModal();
  };

  // If no diet plans are available
  if (dietPlans.length === 0) {
    return (
      <div className={`mb-8 ${showChatbot ? 'text-center p-4' : 'text-center p-6 max-w-xl mx-auto'}`}>
        <h2 className="text-xl font-light mb-3 text-white/80">Your Nutrition Plans</h2>
        <div className="backdrop-blur-lg bg-white/5 rounded-xl p-6 border border-white/10">
          <p className="text-white/60 mb-4">You don't have any nutrition plans yet. Ask the AI coach to create a personalized diet plan for you.</p>
          <button 
            onClick={() => document.getElementById('chat-input')?.focus()}
            className="bg-white/10 backdrop-blur-sm border border-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/15 transition-colors"
          >
            Ask for a Diet Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className={`${showChatbot ? 'text-lg' : 'text-xl'} font-light mb-4 text-white/80`}>Your Nutrition Plans</h2>
        <div className={`grid ${showChatbot ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
          {dietPlans.map((plan) => (
            <div
              key={String(plan.id)}
              className={`backdrop-blur-lg bg-white/5 rounded-xl overflow-hidden shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border ${plan.borderColor} group`}
              onClick={() => openDietPlanModal(plan)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-lg ${plan.iconBg} ${plan.iconColor}`}>
                    {plan.icon || <Apple className="w-6 h-6" />}
                  </div>
                  <span className="text-xs font-light px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/70">{plan.dietType}</span>
                </div>
                <h2 className="text-lg font-medium mb-2 text-white/90">{plan.title}</h2>
                <p className="text-white/60 text-sm mb-4 line-clamp-2">{plan.description}</p>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-xs text-white/50">
                    <Clock size={14} className="mr-1" />
                    {plan.calorieRange} calories
                  </span>
                  <span className="text-white/80 flex items-center text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View Plan
                    <ChevronRight size={14} className="ml-1" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diet Plan Modal */}
      {selectedPlan && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-md transition-all duration-300"
          onClick={closeDietPlanModal}
        >
          <div
            className="bg-white/10 backdrop-blur-xl rounded-xl max-w-lg w-full max-h-screen overflow-y-auto border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className={`p-6 bg-gradient-to-r ${selectedPlan.color} border-b border-white/10`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${selectedPlan.iconBg} ${selectedPlan.iconColor}`}>
                    {selectedPlan.icon || <Apple />}
                  </div>
                  <h2 className="text-xl font-medium ml-3 text-white/90">{selectedPlan.title}</h2>
                </div>
                <button
                  onClick={closeDietPlanModal}
                  className="text-white/80 bg-black/20 backdrop-blur-sm rounded-full p-1.5 hover:bg-black/30 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-5">
                <p className="text-white/70 mb-3 text-sm">{selectedPlan.description}</p>
                <div className="flex space-x-4 text-xs">
                  <span className="flex items-center text-white/60">
                    <Clock size={14} className="mr-1" />
                    {selectedPlan.calorieRange} calories
                  </span>
                  <span className="flex items-center text-white/60 capitalize">
                    {selectedPlan.dietType} diet
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h3 className="font-medium mb-3 text-base text-white/80">Daily Meals:</h3>
                <div className="space-y-3">
                  {selectedPlan.meals.map((meal) => (
                    <div 
                      key={meal.id}
                      className={`flex items-start p-3 rounded ${
                        completedMeals.includes(meal.id) 
                          ? 'bg-green-500/10 border border-green-500/20' 
                          : 'bg-white/5'
                      } cursor-pointer`}
                      onClick={() => toggleMeal(meal.id)}
                    >
                      <span className={`flex-shrink-0 w-5 h-5 mr-2 flex items-center justify-center rounded-full ${
                        completedMeals.includes(meal.id) 
                          ? 'bg-green-500/60 text-white' 
                          : 'bg-white/10'
                      }`}>
                        {completedMeals.includes(meal.id) ? (
                          <Check size={12} />
                        ) : (
                          <span className="text-xs capitalize">{meal.mealType.charAt(0)}</span>
                        )}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className={`font-medium text-sm ${
                            completedMeals.includes(meal.id) 
                              ? 'line-through text-white/40' 
                              : 'text-white/80'
                          }`}>
                            {meal.title}
                          </span>
                          <span className="text-white/50 text-xs capitalize">{meal.mealType}</span>
                        </div>
                        <p className={`text-xs ${
                          completedMeals.includes(meal.id) 
                            ? 'text-white/30' 
                            : 'text-white/60'
                        }`}>
                          {meal.description}
                        </p>
                        {meal.ingredients && meal.ingredients.length > 0 && (
                          <div className="mt-1">
                            <p className="text-xs text-white/50 mt-1">Ingredients:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {meal.ingredients.map((ingredient, idx) => (
                                <span 
                                  key={idx} 
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    completedMeals.includes(meal.id) 
                                      ? 'bg-white/5 text-white/40' 
                                      : 'bg-white/10 text-white/70'
                                  }`}
                                >
                                  {ingredient}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {setDietHistory && (
                <button
                  className="mt-6 w-full bg-white/10 hover:bg-white/15 backdrop-blur-sm py-3 rounded-lg font-medium transition-all duration-200 border border-white/10 text-white/90"
                  onClick={logMeals}
                  disabled={completedMeals.length === 0}
                >
                  {completedMeals.length === 0 
                    ? "Mark meals as completed" 
                    : `Log ${completedMeals.length} completed meal${completedMeals.length > 1 ? 's' : ''}`}
                </button>
              )}

              <div className="mt-4 text-center text-xs text-white/50">
                {completedMeals.length}/{selectedPlan.meals.length} meals completed
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DietPlanComponent;