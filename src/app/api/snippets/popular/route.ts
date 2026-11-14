import { NextResponse } from "next/server";
import { SnippetRepository } from "@/backend/repositories/snippetRepository";

export async function GET() {
  try {
    const all = await SnippetRepository.getAll();
    const popular = [...all]
      .sort((a, b) => {
        const scoreA = (a.copyCount || 0) * 2 + (a.starsCount || 0) * 3;
        const scoreB = (b.copyCount || 0) * 2 + (b.starsCount || 0) * 3;
        return scoreB - scoreA;
      })
      .slice(0, 30);

    return NextResponse.json({ success: true, data: popular });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch popular snippets" },
      { status: 500 }
    );
  }
}

