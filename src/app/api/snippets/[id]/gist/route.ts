import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/backend/services/authService";
import { UserModel } from "@/backend/models/User";
import { SnippetModel } from "@/backend/models/Snippet";
import connectDB from "@/backend/config/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const snippet = await SnippetModel.findById(id);
    if (!snippet) {
      return NextResponse.json({ success: false, message: "Snippet not found" }, { status: 404 });
    }

    const authHeader = req.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = bearer || req.cookies.get("token")?.value;

    let githubToken = process.env.GITHUB_TOKEN || "";
    if (token) {
      const payload = AuthService.verifyToken(token);
      if (payload?.id) {
        const user = await UserModel.findById(payload.id).select("githubAccessToken");
        if (user?.githubAccessToken) githubToken = user.githubAccessToken;
      }
    }

    const primaryFile = snippet.files[0] || { filename: "snippet.dart", code: "" };
    const filesPayload: Record<string, { content: string }> = {};
    snippet.files.forEach((f: any, i: number) => {
      const fname = f.filename?.trim() || `snippet_file_${i + 1}.${f.language || "dart"}`;
      filesPayload[fname] = { content: f.code || "// empty snippet" };
    });

    if (githubToken) {
      const ghRes = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/vnd.github+json",
          "User-Agent": "SnippetHub-App",
          "Authorization": `Bearer ${githubToken}`,
        },
        body: JSON.stringify({
          description: `${snippet.title} - SnippetHub`,
          public: true,
          files: filesPayload,
        }),
      });

      if (ghRes.ok) {
        const ghData = await ghRes.json();
        return NextResponse.json({ success: true, gistUrl: ghData.html_url, isDirect: true });
      }
    }

    return NextResponse.json({
      success: true,
      gistUrl: null,
      isDirect: false,
      fallbackCode: primaryFile.code,
      filename: primaryFile.filename,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
