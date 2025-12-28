import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { title } = await req.json();
    
    // FETCH THE CORRECT STREAM CREDENTIALS
    const API_KEY = process.env.BUNNY_STREAM_API_KEY; 
    const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;

    // Use the official Video creation endpoint but with Live parameters
    const response = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({ 
        title: title,
        // CRITICAL: Tells Bunny to create a Live Ingest point
        isLive: true 
      })
    });

    const data = await response.json();
    
    // Log details for debugging if rejection persists
    if (!response.ok) {
      console.error("Bunny.net Detailed Rejection:", data);
      return NextResponse.json({ error: data.message || "Bunny.net rejected the request." }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Broadcaster Studio API Error:", error);
    return NextResponse.json({ error: "Server error occurred while reaching Bunny.net" }, { status: 500 });
  }
}