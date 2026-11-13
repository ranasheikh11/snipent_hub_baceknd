import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { success: false, message: "GITHUB_CLIENT_ID not configured." },
      { status: 500 }
    );
  }

  const callbackBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const redirectUri = `${callbackBase}/api/auth/github/callback`;

  const referer = req.headers.get("referer") || "";
  const returnTo = req.nextUrl.searchParams.get("redirect") || referer || "http://localhost:3000";
  const state = Buffer.from(JSON.stringify({ returnTo })).toString("base64");

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=user:email&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(githubAuthUrl);
}
