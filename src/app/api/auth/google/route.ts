import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { success: false, message: "GOOGLE_CLIENT_ID not configured in .env." },
      { status: 500 }
    );
  }

  const callbackBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const redirectUri = `${callbackBase}/api/auth/google/callback`;
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });

  return NextResponse.redirect(`${rootUrl}?${options.toString()}`);
}

