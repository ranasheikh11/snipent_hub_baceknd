import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/backend/services/authService";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ success: false, message: "GOOGLE_CLIENT_ID not configured" }, { status: 500 });
  }

  const token = req.nextUrl.searchParams.get("token") || req.cookies.get("token")?.value;
  const user = token ? AuthService.verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ success: false, message: "Please login first to connect YouTube" }, { status: 401 });
  }

  const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const redirectUri = `${backendBase}/api/auth/youtube/callback`;
  const returnTo = req.nextUrl.searchParams.get("returnTo") || "http://localhost:3000/courses/create";

  const state = Buffer.from(JSON.stringify({ userId: user.id, returnTo })).toString("base64");
  const scope = encodeURIComponent("openid email profile https://www.googleapis.com/auth/youtube.readonly");

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(googleAuthUrl);
}

