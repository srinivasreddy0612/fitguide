import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function POST(request: Request) {
  console.log("Chat API route called");
  
  try {
    // Get the authenticated user
    const { userId } = auth();
    
    // Check if the user is authenticated
    if (!userId) {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json({ 
        error: 'Invalid request body',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 });
    }
    
    const { messages } = body;
    
    // Check if messages is valid
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid or missing messages array in request");
      return NextResponse.json({ 
        error: 'Invalid request: messages array required' 
      }, { status: 400 });
    }
    
    // Verify that GROQ_API_KEY is defined
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY is not defined in environment variables');
      
      // Fallback to a simple response rather than failing
      console.log("Using fallback response due to missing API key");
      return NextResponse.json({
        message: "I'm Tony, your fitness coach. I'm currently experiencing some technical difficulties connecting to my knowledge base. Please try again later or ask me something simple about fitness that I can help with directly.",
        role: 'assistant'
      });
    }
    
    console.log(`Calling Groq API for chat with ${messages.length} messages`);
    
    // Call Groq API with error handling and timeout
    try {
      // Set up AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192', // Corrected model name
          messages: messages,
          temperature: 0.7,
          max_tokens: 256
        }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
      
      // Check for response status
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Groq API error response:', errorData);
        
        // Provide a helpful fallback response
        return NextResponse.json({
          message: "I'm having trouble connecting to my knowledge base right now. Let's keep it simple - what specifically can I help you with regarding fitness?",
          role: 'assistant'
        });
      }
      
      const data = await response.json();
      console.log('Successfully received chat response from Groq');
      
      // Check if data has the expected structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected response structure from Groq API:', data);
        return NextResponse.json({
          message: "I received an unexpected response format. Let me try to help with what I know directly about fitness.",
          role: 'assistant'
        });
      }
      
      // Return AI response
      return NextResponse.json({
        message: data.choices[0].message.content,
        role: 'assistant'
      });
      
    } catch (fetchError) {
      console.error('Error fetching from Groq API:', fetchError);
      
      // Handle timeout specifically
      if (fetchError.name === 'AbortError') {
        console.log("Request to Groq API timed out");
        return NextResponse.json({
          message: "Sorry for the delay. My response system is running a bit slowly. Could you ask again or try a simpler question?",
          role: 'assistant'
        });
      }
      
      // General fetch error fallback
      return NextResponse.json({
        message: "I'm having connection issues with my knowledge base. Let me try to help with what I know directly. What fitness questions can I answer for you?",
        role: 'assistant'
      });
    }
    
  } catch (error) {
    console.error('Chat API unhandled error:', error);
    
    // Return a helpful message rather than an error
    return NextResponse.json({
      message: "I encountered a technical issue. Please try again with your question.",
      role: 'assistant'
    }, { status: 200 }); // Return 200 so the front-end doesn't show an error
  }
}