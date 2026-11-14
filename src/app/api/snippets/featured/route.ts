import { NextResponse } from "next/server";
import { SnippetRepository } from "@/backend/repositories/snippetRepository";

export async function GET() {
  try {
    const all = await SnippetRepository.getAll();
    if (!all.length) {
      return NextResponse.json({ success: true, data: null });
    }

    // Pick top snippet with multiple files or highest engagement
    const sorted = [...all].sort((a, b) => {
      const scoreA = (a.starsCount || 0) * 4 + (a.copyCount || 0) * 2 + (a.files?.length || 1) * 3;
      const scoreB = (b.starsCount || 0) * 4 + (b.copyCount || 0) * 2 + (b.files?.length || 1) * 3;
      return scoreB - scoreA;
    });

    const featured = sorted[0] || null;
    return NextResponse.json({ success: true, data: featured });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch featured snippet" },
      { status: 500 }
    );
  }
}

