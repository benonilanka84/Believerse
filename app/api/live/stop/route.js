import { IvsClient, DeleteChannelCommand } from "@aws-sdk/client-ivs";
import { NextResponse } from "next/server";

const ivsClient = new IvsClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  try {
    const { channelArn } = await req.json();

    // Safety check to ensure we have an ID before calling AWS
    if (!channelArn) return NextResponse.json({ error: "Missing Channel ARN" }, { status: 400 });

    const command = new DeleteChannelCommand({ arn: channelArn });
    await ivsClient.send(command);

    return NextResponse.json({ success: true, message: "Fellowship stopped successfully." });
  } catch (error) {
    console.error("AWS Stop Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}