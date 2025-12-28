import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { title } = await req.json();
    
    // Use your existing Bunny.net credentials from .env
    const API_KEY = process.env.BUNNY_API_KEY; 
    const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;

    const response = await fetch(`https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: title })
    });

    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || "Bunny.net API Error");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Bunny Create Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}