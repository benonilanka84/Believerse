import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { title } = await req.json();
    
    // FETCH THE CORRECT STREAM CREDENTIALS
    const API_KEY = process.env.BUNNY_STREAM_API_KEY; 
    const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;

    // Correct Bunny Stream Live Endpoint
    const response = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        title: title,
        // Enabling live features explicitly
        isLive: true 
      })
    });

    const data = await response.json();
    
    // Log the error for your own internal debugging
    if (!response.ok) {
      console.error("Bunny.net Detailed Error:", data);
      throw new Error(data.message || "Bunny.net API rejected the request.");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Broadcaster Studio API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}