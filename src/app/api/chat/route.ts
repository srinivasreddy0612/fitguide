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
      console.log("API key not configured: NEXT_PUBLIC_GROQ_API_KEY is missing");
      return NextResponse.json({
        message: "I'm having trouble accessing my knowledge. Let me help with what I know directly about fitness instead.",
        role: 'assistant'
      });
    }
    
    console.log("Calling Groq API with model: llama3-8b-8192");
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: messages,
        temperature: 0.7,
        max_tokens: 256
      })
    });
    
    if (!response.ok) {
      console.log("Groq API error:", response.status, response.statusText);
      return NextResponse.json({
        message: "I'm having some connection issues. Let me help with what I know directly about fitness.",
        role: 'assistant'
      });
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      message: data.choices[0].message.content,
      role: 'assistant'
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      message: "I encountered a technical issue. What fitness questions can I help with?",
      role: 'assistant'
    });
  }
}