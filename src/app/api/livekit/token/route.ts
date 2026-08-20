import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { roomName, userId, userName } = await req.json();

    if (!roomName || !userId) {
      return NextResponse.json(
        { error: "roomName and userId are required" },
        { status: 400 }
      );
    }

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: userId,
        name: userName ?? userId,
      }
    );

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    return NextResponse.json({ token: jwt });
  } catch (error) {
    console.error("LiveKit token error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
