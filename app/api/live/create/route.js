import { IvsClient, CreateChannelCommand } from "@aws-sdk/client-ivs";
import { NextResponse } from "next/server";

// Initialize the IVS client with credentials from your .env.local
const ivsClient = new IvsClient({
  region: process.env.AWS_REGION, // ap-south-1 (Mumbai)
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  try {
    const { title } = await req.json();

    // Configure the new channel
    const command = new CreateChannelCommand({
      name: `believerse-${Date.now()}`,
      type: "STANDARD",      // Best quality for Full HD streaming
      latencyMode: "LOW",    // Essential for real-time prayer/chat interaction
      tags: { "Title": title }
    });

    const response = await ivsClient.send(command);

    // Return all necessary data to the frontend
    return NextResponse.json({
      ingestEndpoint: response.channel.ingestEndpoint, // For OBS Server URL
      streamKey: response.streamKey.value,           // For OBS Stream Key
      playbackUrl: response.channel.playbackUrl,      // For the Viewer Page
      channelArn: response.channel.arn               // CRITICAL: Used to stop/delete the channel
    });
  } catch (error) {
    console.error("AWS IVS Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}