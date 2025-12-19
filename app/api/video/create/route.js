import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { title } = await request.json();
    
    const apiKey = process.env.BUNNY_STREAM_API_KEY;
    const libraryId = process.env.BUNNY_LIBRARY_ID;

    if (!apiKey || !libraryId) {
      return NextResponse.json(
        { error: 'Missing Bunny configuration' }, 
        { status: 500 }
      );
    }

    // 1. Create the Video placeholder in Bunny Stream first
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

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(errorData.message || 'Failed to create video entry');
    }

    const videoData = await createResponse.json();
    const videoId = videoData.guid;

    // 2. Generate the Security Signature for Tus
    const expirationTime = Math.floor(Date.now() / 1000) + 3600; // Expires in 1 hour
    
    // Formula: libraryId + apiKey + expirationTime + videoId
    const dataToSign = libraryId + apiKey + expirationTime + videoId;
    const signature = crypto.createHash('sha256').update(dataToSign).digest('hex');

    return NextResponse.json({
      videoId,
      libraryId,
      signature,
      expirationTime,
    });

  } catch (error) {
    console.error('Video API Error:', error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}