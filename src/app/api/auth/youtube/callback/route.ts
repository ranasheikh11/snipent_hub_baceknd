import { NextRequest, NextResponse } from "next/server";
import { UserModel } from "@/backend/models/User";
import connectDB from "@/backend/config/db";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateParam = req.nextUrl.searchParams.get("state");
  let userId = "";
  let returnTo = "http://localhost:3000/courses/create";

  if (stateParam) {
    try {
      const decoded = JSON.parse(Buffer.from(stateParam, "base64").toString("utf-8"));
      if (decoded.userId) userId = decoded.userId;
      if (decoded.returnTo) returnTo = decoded.returnTo;
    } catch {}
  }

  const redirectUrl = new URL(returnTo);
  if (!code || !userId) {
    redirectUrl.searchParams.set("error", "youtube_auth_failed");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const redirectUri = `${backendBase}/api/auth/youtube/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("Failed to obtain YouTube token");

    let channelTitle = "";
    try {
      const chRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const chData = await chRes.json();
      channelTitle = chData.items?.[0]?.snippet?.title || "";
    } catch {}

    await connectDB();
    await UserModel.findByIdAndUpdate(userId, {
      googleAccessToken: tokenData.access_token,
      ...(tokenData.refresh_token ? { googleRefreshToken: tokenData.refresh_token } : {}),
      youtubeConnected: true,
      youtubeChannelTitle: channelTitle,
    });

    redirectUrl.searchParams.set("youtube", "connected");
    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    redirectUrl.searchParams.set("error", err.message || "oauth_failed");
    return NextResponse.redirect(redirectUrl);
  }
}

