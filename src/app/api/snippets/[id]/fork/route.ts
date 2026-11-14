import { NextRequest, NextResponse } from "next/server";
import { SnippetService } from "@/backend/services/snippetService";
import { AuthService } from "@/backend/services/authService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookieToken = req.cookies.get("token")?.value;
    const token = bearerToken || cookieToken;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Please login to fork this snippet" },
        { status: 401 }
      );
    }

    const user = AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired session. Please login again." },
        { status: 401 }
      );
    }

    const forked = await SnippetService.forkSnippet(id, user.name, user.id);
    if (!forked) {
      return NextResponse.json({ success: false, message: "Snippet not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: forked, message: "Snippet forked successfully to your profile!" });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
