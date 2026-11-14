import { NextRequest, NextResponse } from "next/server";
import { SnippetService } from "@/backend/services/snippetService";
import { AuthService } from "@/backend/services/authService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token =
      req.cookies.get("token")?.value ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const user = token ? AuthService.verifyToken(token) : null;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userKey = user?.id || user?.email || `guest_${ip}`;

    const result = await SnippetService.starSnippet(id, userKey);
    return NextResponse.json({
      success: true,
      starred: result.starred,
      starsCount: result.starsCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || "Failed to toggle star" },
      { status: 500 }
    );
  }
}
