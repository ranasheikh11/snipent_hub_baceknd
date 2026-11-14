import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/backend/services/authService";
import { YouTubeService } from "@/backend/services/youtubeService";
import { UserModel } from "@/backend/models/User";
import connectDB from "@/backend/config/db";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = bearer || req.cookies.get("token")?.value;

    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const userPayload = AuthService.verifyToken(token);
    if (!userPayload) return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });

    await connectDB();
    const user = await UserModel.findById(userPayload.id).select("youtubeConnected youtubeChannelTitle");
    const validToken = await YouTubeService.getValidToken(userPayload.id);

    if (!validToken || !user?.youtubeConnected) {
      return NextResponse.json({ success: true, connected: false, playlists: [] });
    }

    const playlists = await YouTubeService.fetchMyPlaylists(validToken);
    return NextResponse.json({
      success: true,
      connected: true,
      channelTitle: user.youtubeChannelTitle || "",
      playlists,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

