import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/backend/services/authService";

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  if (host && !host.includes("localhost")) {
    return `${proto}://${host}`.replace(/\/+$/, "");
  }
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  return (host ? `${proto}://${host}` : req.nextUrl.origin).replace(/\/+$/, "");
}

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

  const redirectUri = `${getBaseUrl(req)}/api/auth/youtube/callback`;
  const returnTo = req.nextUrl.searchParams.get("returnTo") || "https://snipent-hub.vercel.app/courses/create";

  const state = Buffer.from(JSON.stringify({ userId: user.id, returnTo })).toString("base64");
  const scope = encodeURIComponent("openid email profile https://www.googleapis.com/auth/youtube.readonly");

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(googleAuthUrl);
}
