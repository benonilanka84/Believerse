import { NextResponse } from "next/server";
import { pushLiveArchiveToBunny } from "@/lib/bunny-utils";

export async function POST(req) {
  try {
    const body = await req.json();

    // AWS IVS recording events typically include the S3 path
    const { userId, recordingUrl, streamName } = body;

    if (!userId || !recordingUrl) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    // Trigger the Step 2 Bridge
    const bunnyVideoId = await pushLiveArchiveToBunny(
      userId, 
      recordingUrl, 
      streamName || "Sermon Archive"
    );

    return NextResponse.json({ message: "Bridge activated", bunnyVideoId });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}