import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    if (body.Status !== 3) return NextResponse.json({ message: "Encoding..." });

    const videoId = body.VideoGuid;
    const libraryId = body.VideoLibraryId;

    // 1. "Double-Check" to get the userId from Bunny's API
    const videoDataRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
      headers: { 'AccessKey': process.env.BUNNY_API_KEY }
    });
    const videoData = await videoDataRes.json();
    
    // 2. Extract the userId we stored in Step 2
    const userId = videoData.searchTags || "SYSTEM_USER"; 

    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;

    // 3. Post to the broadcaster's wall
    const { error } = await supabaseAdmin.from('posts').insert({
      user_id: userId,
      type: 'Sermon',
      title: videoData.title,
      content: `Praise God! The live broadcast is now available for replay.`,
      media_url: embedUrl
    });

    if (error) throw error;
    return NextResponse.json({ message: "Live Archive Published" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}