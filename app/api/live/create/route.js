import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { title } = await req.json();
    
    // Use the GLOBAL Account key for this specific action
    const ACCOUNT_API_KEY = process.env.BUNNY_ACCOUNT_API_KEY; 
    const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;

    const response = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': ACCOUNT_API_KEY, 
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({ 
        title: title,
        isLive: true 
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.message }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "API connection error" }, { status: 500 });
  }
}