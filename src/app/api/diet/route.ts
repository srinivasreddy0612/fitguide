import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { messages } = body;
    
    // Check if messages is valid
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ 
        error: 'Invalid request: messages array required' 
      }, { status: 400 });
    }
    
    // Use the correct environment variable name
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!apiKey) {
      console.log('API key not configured: NEXT_PUBLIC_GROQ_API_KEY is missing, using fallback diet plan');
      
      // Create a fallback diet plan
      const dietType = determineDietType(messages);
      return NextResponse.json({ 
        content: createFallbackDietPlan(dietType)
      });
    }
    
    console.log('Calling Groq API for diet plan generation with model: llama3-8b-8192');
    
    // Create system message for diet plan
    const systemMessage = {
      role: 'system',
      content: `You are a nutrition expert who creates personalized diet plans. Generate a complete diet plan in valid JSON format that matches this structure:
{
  "title": "Diet Plan Title",
  "description": "Brief description of the diet plan",
  "dietType": "balanced" | "keto" | "vegan" | "paleo" | "intermittent",
  "calorieRange": "1500-1800" | "1800-2200" | "2200-2500" | "2500-3000",
  "meals": [
    { 
      "mealType": "breakfast" | "lunch" | "dinner" | "snack",
      "title": "Meal title",
      "description": "Brief description",
      "ingredients": ["ingredient 1", "ingredient 2", ...]
    },
    ...
  ]
}
Choose the most appropriate diet type and calorie range based on the user's request. Include at least 3 meals (breakfast, lunch, dinner) and optionally 1-2 snacks. Keep the JSON format exactly as specified.`
    };
    
    // Add the system message to the messages array
    const enhancedMessages = [
      systemMessage,
      ...messages
    ];
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: enhancedMessages,
        temperature: 0.7,
        max_tokens: 1500 // Increase token limit for larger response
      })
    });
    
    // Check for response status
    if (!response.ok) {
      console.log('Groq API error, using fallback diet plan');
      
      // Use fallback diet plan if API fails
      const dietType = determineDietType(messages);
      return NextResponse.json({ 
        content: createFallbackDietPlan(dietType)
      });
    }
    
    const data = await response.json();
    
    try {
      // Extract the JSON response
      const jsonResponse = data.choices[0].message.content;
      
      // Try to parse the JSON
      let dietData;
      try {
        // Find and extract the JSON object if there's extra text
        const jsonMatch = jsonResponse.match(/({[\s\S]*})/);
        const jsonString = jsonMatch ? jsonMatch[0] : jsonResponse;
        dietData = JSON.parse(jsonString);
      } catch (parseError) {
        console.log('Error parsing diet plan JSON, using fallback', parseError);
        
        // Use fallback diet plan if parsing fails
        const dietType = determineDietType(messages);
        return NextResponse.json({ 
          content: createFallbackDietPlan(dietType)
        });
      }
      
      // Validate the diet data
      if (!dietData.title || !dietData.dietType || !dietData.meals || !Array.isArray(dietData.meals)) {
        console.log('Invalid diet data structure, using fallback');
        
        // Use fallback diet plan if data is invalid
        const dietType = determineDietType(messages);
        return NextResponse.json({ 
          content: createFallbackDietPlan(dietType)
        });
      }
      
      // Add visual styling based on diet type
      const styleInfo = getDietStyles(dietData.dietType);
      
      // Create the complete diet plan object
      const dietPlan = {
        id: Date.now(),
        title: dietData.title,
        description: dietData.description || `A ${dietData.dietType} diet plan with approximately ${dietData.calorieRange} calories.`,
        dietType: dietData.dietType,
        calorieRange: dietData.calorieRange || "1800-2200",
        meals: dietData.meals.map((meal: any, index: number) => ({
          id: index + 1,
          ...meal
        })),
        ...styleInfo
      };
      
      return NextResponse.json({ content: dietPlan });
      
    } catch (processingError) {
      console.log('Error processing diet plan response, using fallback', processingError);
      
      // Use fallback diet plan if processing fails
      const dietType = determineDietType(messages);
      return NextResponse.json({ 
        content: createFallbackDietPlan(dietType)
      });
    }
    
  } catch (error) {
    console.error('Diet plan API error:', error);
    
    // Return a fallback diet plan rather than an error
    return NextResponse.json({ 
      content: createFallbackDietPlan("balanced")
    });
  }
}

// Helper function to determine diet type from messages
function determineDietType(messages: any[]): 'balanced' | 'keto' | 'vegan' | 'paleo' | 'intermittent' {
  try {
    // Get the user's message content (usually the last message)
    const userMessage = messages.find(msg => msg.role === 'user')?.content || '';
    const lowerCaseMessage = userMessage.toLowerCase();
    
    if (lowerCaseMessage.includes('keto') || lowerCaseMessage.includes('low carb')) {
      return 'keto';
    } else if (lowerCaseMessage.includes('vegan') || lowerCaseMessage.includes('plant based')) {
      return 'vegan';
    } else if (lowerCaseMessage.includes('paleo') || lowerCaseMessage.includes('caveman')) {
      return 'paleo';
    } else if (lowerCaseMessage.includes('intermittent') || lowerCaseMessage.includes('fasting')) {
      return 'intermittent';
    } else {
      return 'balanced';
    }
  } catch (error) {
    console.error('Error determining diet type:', error);
    return 'balanced'; // Default fallback
  }
}

// Create a fallback diet plan when API fails
function createFallbackDietPlan(dietType: 'balanced' | 'keto' | 'vegan' | 'paleo' | 'intermittent') {
  const styleInfo = getDietStyles(dietType);
  let title, description, calorieRange, meals;
  
  switch (dietType) {
    case 'keto':
      title = "Low-Carb Keto Diet Plan";
      description = "A ketogenic diet plan focused on high fat, moderate protein, and very low carbohydrates to promote ketosis.";
      calorieRange = "1800-2200";
      meals = [
        {
          id: 1,
          mealType: "breakfast",
          title: "Avocado & Egg Bowl",
          description: "A hearty breakfast bowl with healthy fats to start your day.",
          ingredients: ["2 eggs", "1/2 avocado", "2 strips bacon", "1/4 cup spinach", "1 tbsp olive oil"]
        },
        {
          id: 2,
          mealType: "lunch",
          title: "Keto Cobb Salad",
          description: "A filling salad with plenty of protein and healthy fats.",
          ingredients: ["2 cups mixed greens", "4 oz grilled chicken", "1 hard-boiled egg", "1/4 cup blue cheese", "1/2 avocado", "2 tbsp olive oil", "1 tbsp vinegar"]
        },
        {
          id: 3,
          mealType: "dinner",
          title: "Butter-Basted Steak & Vegetables",
          description: "A satisfying dinner with protein and low-carb vegetables.",
          ingredients: ["6 oz ribeye steak", "1 tbsp butter", "1 cup roasted broccoli", "1/2 cup cauliflower", "2 cloves garlic", "1 tbsp olive oil"]
        },
        {
          id: 4,
          mealType: "snack",
          title: "Keto Fat Bombs",
          description: "A quick energy boost with healthy fats.",
          ingredients: ["2 tbsp coconut oil", "1 tbsp almond butter", "1 tbsp cocoa powder", "Stevia to taste"]
        }
      ];
      break;
      
    case 'vegan':
      title = "Plant-Based Vegan Meal Plan";
      description = "A nutrient-dense vegan diet plan that provides complete protein sources and essential nutrients without animal products.";
      calorieRange = "1800-2200";
      meals = [
        {
          id: 1,
          mealType: "breakfast",
          title: "Berry Protein Smoothie Bowl",
          description: "A protein-rich breakfast to fuel your morning.",
          ingredients: ["1 banana", "1 cup mixed berries", "1 scoop plant protein powder", "1/4 cup almond milk", "1 tbsp chia seeds", "1 tbsp almond butter", "Granola for topping"]
        },
        {
          id: 2,
          mealType: "lunch",
          title: "Quinoa Buddha Bowl",
          description: "A complete protein lunch with diverse vegetables and flavors.",
          ingredients: ["1 cup cooked quinoa", "1/2 cup roasted chickpeas", "1 cup mixed vegetables (carrots, broccoli, bell peppers)", "1/4 avocado", "2 tbsp tahini dressing"]
        },
        {
          id: 3,
          mealType: "dinner",
          title: "Lentil & Vegetable Curry",
          description: "A warming, protein-rich dinner with complex flavors.",
          ingredients: ["1 cup cooked lentils", "2 cups mixed vegetables", "1 can coconut milk", "2 tbsp curry paste", "1 tbsp olive oil", "Brown rice for serving"]
        },
        {
          id: 4,
          mealType: "snack",
          title: "Hummus & Veggie Sticks",
          description: "A protein-rich snack with fiber and nutrients.",
          ingredients: ["1/4 cup hummus", "Carrot sticks", "Cucumber slices", "Bell pepper strips"]
        }
      ];
      break;
      
    case 'paleo':
      title = "Hunter-Gatherer Paleo Plan";
      description = "A primal diet focused on whole, unprocessed foods that mimic the eating patterns of our ancestors.";
      calorieRange = "2000-2400";
      meals = [
        {
          id: 1,
          mealType: "breakfast",
          title: "Sweet Potato Hash with Eggs",
          description: "A hearty breakfast with quality protein and unprocessed carbs.",
          ingredients: ["2 eggs", "1 medium sweet potato, diced", "1/4 onion, diced", "1/2 bell pepper, diced", "2 tbsp olive oil", "Avocado for serving"]
        },
        {
          id: 2,
          mealType: "lunch",
          title: "Grilled Chicken & Vegetable Bowl",
          description: "A simple lunch with lean protein and seasonal vegetables.",
          ingredients: ["5 oz grilled chicken breast", "2 cups mixed greens", "1 cup roasted vegetables", "1/2 avocado", "Olive oil and lemon dressing"]
        },
        {
          id: 3,
          mealType: "dinner",
          title: "Grass-Fed Beef & Roasted Vegetables",
          description: "A nutrient-dense dinner focusing on quality protein and vegetables.",
          ingredients: ["5 oz grass-fed beef", "2 cups roasted seasonal vegetables", "1 tbsp ghee", "Fresh herbs", "Sea salt"]
        },
        {
          id: 4,
          mealType: "snack",
          title: "Mixed Nuts & Berries",
          description: "A simple, nutrient-dense snack.",
          ingredients: ["1/4 cup mixed nuts (almonds, walnuts)", "1/2 cup mixed berries"]
        }
      ];
      break;
      
    case 'intermittent':
      title = "16/8 Intermittent Fasting Plan";
      description = "A timing-focused eating pattern with an 8-hour eating window and 16-hour fasting period to promote cellular repair and fat burning.";
      calorieRange = "1800-2200";
      meals = [
        {
          id: 1,
          mealType: "breakfast",
          title: "Breaking Fast Protein Bowl (12pm)",
          description: "A nutrient-dense meal to break your fast.",
          ingredients: ["3 eggs scrambled", "1/2 avocado", "1/2 cup sweet potato", "1 cup spinach", "1 tbsp olive oil", "Sea salt and pepper"]
        },
        {
          id: 2,
          mealType: "lunch",
          title: "Hearty Protein & Greens (3pm)",
          description: "A satisfying mid-day meal rich in protein and nutrients.",
          ingredients: ["5 oz grilled chicken or tofu", "2 cups mixed greens", "1/4 cup quinoa", "1/2 cup roasted vegetables", "2 tbsp olive oil dressing"]
        },
        {
          id: 3,
          mealType: "dinner",
          title: "Balanced Evening Meal (7pm)",
          description: "The final meal before beginning the fast.",
          ingredients: ["5 oz salmon or lean protein", "1 cup broccoli", "1/2 cup brown rice or sweet potato", "1 tbsp olive oil", "Herbs and spices"]
        },
        {
          id: 4,
          mealType: "note",
          title: "Fasting Window (8pm-12pm)",
          description: "During this time, consume only water, black coffee, or unsweetened tea.",
          ingredients: ["Water", "Black coffee (optional)", "Unsweetened tea (optional)"]
        }
      ];
      break;
      
    default: // balanced
      title = "Balanced Nutrition Plan";
      description = "A well-rounded diet plan with balanced macronutrients for overall health and energy.";
      calorieRange = "1800-2200";
      meals = [
        {
          id: 1,
          mealType: "breakfast",
          title: "Greek Yogurt Breakfast Bowl",
          description: "A protein-rich breakfast with complex carbohydrates and healthy fats.",
          ingredients: ["1 cup Greek yogurt", "1/4 cup granola", "1 tbsp honey", "1/2 cup mixed berries", "1 tbsp chia seeds"]
        },
        {
          id: 2,
          mealType: "lunch",
          title: "Mediterranean Chicken Wrap",
          description: "A balanced lunch with lean protein, whole grains, and vegetables.",
          ingredients: ["4 oz grilled chicken", "1 whole grain wrap", "1/4 cup hummus", "1 cup mixed greens", "1/4 cup cucumbers", "1/4 cup cherry tomatoes", "1 tbsp olive oil"]
        },
        {
          id: 3,
          mealType: "dinner",
          title: "Baked Salmon with Quinoa & Vegetables",
          description: "A nutrient-dense dinner with lean protein, complex carbs, and fiber.",
          ingredients: ["5 oz salmon fillet", "1/2 cup cooked quinoa", "1 cup roasted vegetables (broccoli, carrots, bell peppers)", "1 tbsp olive oil", "Lemon and herbs for seasoning"]
        },
        {
          id: 4,
          mealType: "snack",
          title: "Apple with Almond Butter",
          description: "A balanced snack with fiber, healthy fats, and natural sugars.",
          ingredients: ["1 medium apple", "1 tbsp almond butter"]
        }
      ];
      break;
  }
  
  return {
    id: Date.now(),
    title,
    description,
    dietType,
    calorieRange,
    meals,
    ...styleInfo
  };
}

// Helper function to get the visual styling based on diet type
function getDietStyles(dietType: string): {
  color: string;
  borderColor: string;
  iconColor: string;
  iconBg: string;
} {
  switch(dietType) {
    case 'balanced':
      return {
        color: 'from-teal-500/40 to-emerald-600/40',
        borderColor: 'border-teal-500/20',
        iconColor: 'text-teal-500',
        iconBg: 'bg-teal-500/10'
      };
    case 'keto':
      return {
        color: 'from-indigo-500/40 to-purple-600/40',
        borderColor: 'border-indigo-500/20',
        iconColor: 'text-indigo-500',
        iconBg: 'bg-indigo-500/10'
      };
    case 'vegan':
      return {
        color: 'from-green-500/40 to-lime-600/40',
        borderColor: 'border-green-500/20',
        iconColor: 'text-green-500',
        iconBg: 'bg-green-500/10'
      };
    case 'paleo':
      return {
        color: 'from-amber-500/40 to-orange-600/40',
        borderColor: 'border-amber-500/20',
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-500/10'
      };
    case 'intermittent':
      return {
        color: 'from-blue-500/40 to-sky-600/40',
        borderColor: 'border-blue-500/20',
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10'
      };
    default:
      return {
        color: 'from-teal-500/40 to-emerald-600/40',
        borderColor: 'border-teal-500/20',
        iconColor: 'text-teal-500',
        iconBg: 'bg-teal-500/10'
      };
  }
}