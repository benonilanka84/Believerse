import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { title } = await request.json();
    
    // 1. Authenticate and Get User Tier
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch Tier from Profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.subscription_tier?.toLowerCase() || 'free';

    // 2. Configuration Check
    const apiKey = process.env.BUNNY_STREAM_API_KEY;
    const libraryId = process.env.BUNNY_LIBRARY_ID;

    if (!apiKey || !libraryId) {
      console.error("Missing BunnyCDN Env Vars");
      return NextResponse.json(
        { error: 'Server Configuration Error' }, 
        { status: 500 }
      );
    }

    // 3. Create Video Placeholder in Bunny Stream
    // Note: Duration validation happens in the frontend and at the webhook stage, 
    // but the backend creates the placeholder only for authenticated tier holders.
    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: 'POST',
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          title: title || 'Untitled Post',
          // Pass the tier in metadata so Bunny/Webhook can identify limits later
          metaData: [
            { property: "tier", value: tier },
            { property: "userId", value: user.id }
          ]
        }),
      }
    );

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Bunny Error: ${errorData.message || createResponse.statusText}` },
        { status: createResponse.status }
      );
    }

    const videoData = await createResponse.json();
    const videoId = videoData.guid;

    // 4. Generate Security Signature for Tus
    const expirationTime = Math.floor(Date.now() / 1000) + 3600; 
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