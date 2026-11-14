import { NextRequest, NextResponse } from "next/server";

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
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { success: false, message: "GITHUB_CLIENT_ID not configured." },
      { status: 500 }
    );
  }

  const redirectUri = `${getBaseUrl(req)}/api/auth/github/callback`;
  const referer = req.headers.get("referer") || "";
  const returnTo = req.nextUrl.searchParams.get("redirect") || referer || "https://snipent-hub.vercel.app";
  const state = Buffer.from(JSON.stringify({ returnTo })).toString("base64");

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=user:email,gist&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(githubAuthUrl);
}
