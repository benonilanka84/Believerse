import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();

    // Bunny Stream status '3' means the video is finished and ready
    if (body.Status !== 3) {
      return NextResponse.json({ message: "Status ignored" });
    }

    const videoId = body.VideoGuid;
    const libraryId = body.VideoLibraryId;
    const title = body.Title || "Live Stream Archive";

    // You need a way to link this to a User ID. 
    // Tip: When you start the upload/stream, pass the userId in the title or metadata.
    // For now, we fetch the first admin or a placeholder if userId isn't in the payload.
    const userId = body.UserId || "PLACEHOLDER_SYSTEM_USER_ID"; 

    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;

    // Insert into 'The Walk'
    const { error } = await supabaseAdmin.from('posts').insert({
      user_id: userId,
      type: 'Sermon',
      title: title,
      content: `I was live! Here is the recorded broadcast for the fellowship.`,
      media_url: embedUrl,
      created_at: new Date().toISOString()
    });

    if (error) throw error;

    return NextResponse.json({ message: "Broadcast posted to The Walk" });
  } catch (err) {
    console.error("Bunny Webhook Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}