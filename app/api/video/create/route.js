// app/api/video/create/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { title } = await request.json();
    
    // 1. Debugging: Check if keys exist (Do not log the actual keys for security)
    const apiKey = process.env.BUNNY_STREAM_API_KEY;
    const libraryId = process.env.BUNNY_LIBRARY_ID;

    if (!apiKey || !libraryId) {
      console.error("Missing BunnyCDN Env Vars");
      return NextResponse.json(
        { error: 'Server Configuration Error: Missing BUNNY_STREAM_API_KEY or BUNNY_LIBRARY_ID' }, 
        { status: 500 }
      );
    }

    // 2. Create the Video placeholder in Bunny Stream
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ title: title || 'Untitled Post' }),
      }
    );

    // 3. Handle Bunny API Errors
    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({})); // Safe parse
      console.error("Bunny API Error:", createResponse.status, errorData);
      
      // Pass the specific message from Bunny back to the frontend
      return NextResponse.json(
        { error: `Bunny Error: ${errorData.message || createResponse.statusText}` },
        { status: createResponse.status }
      );
    }

    const videoData = await createResponse.json();
    const videoId = videoData.guid;

    // 4. Generate the Security Signature for Tus
    const expirationTime = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour
    const dataToSign = libraryId + apiKey + expirationTime + videoId;
    const signature = crypto.createHash('sha256').update(dataToSign).digest('hex');

    return NextResponse.json({
      videoId,
      libraryId,
      signature,
      expirationTime,
    });

  } catch (error) {
    console.error('Video API Critical Failure:', error);
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message}` }, 
      { status: 500 }
    );
  }
}