import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/backend/services/authService";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const frontendBase = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  if (!code) {
    const errorUrl = new URL(frontendBase);
    errorUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(errorUrl);
  }

  try {
    const callbackBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const redirectUri = `${callbackBase}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || "Failed to get Google token");
    }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    const { token } = await AuthService.googleLoginOrRegister({
      googleId: String(googleUser.sub),
      name: googleUser.name || "Google User",
      email: googleUser.email,
      avatar: googleUser.picture || "",
    });

    const redirectUrl = new URL(frontendBase);
    redirectUrl.searchParams.set("auth", "success");
    redirectUrl.searchParams.set("token", token);

    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "none",
      secure: true,
    });
    return res;
  } catch (err: any) {
    const redirectUrl = new URL(frontendBase);
    redirectUrl.searchParams.set("error", err.message || "Google auth failed");
    return NextResponse.redirect(redirectUrl);
  }
}

