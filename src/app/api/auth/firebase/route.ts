import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/backend/services/authService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, email, name, avatar } = body;
    if (!uid || !email) {
      return NextResponse.json({ success: false, message: "Missing uid or email" }, { status: 400 });
    }

    const { user, token } = await AuthService.socialLogin({
      provider: "google",
      providerId: uid,
      name: name || "Google User",
      email,
      avatar: avatar || "",
    });

    const res = NextResponse.json({ success: true, user, token });
    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "none",
      secure: true,
    });
    return res;
  } catch (err: any) {
    console.error("Firebase auth error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

