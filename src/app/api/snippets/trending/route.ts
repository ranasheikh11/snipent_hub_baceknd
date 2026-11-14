import { NextResponse } from "next/server";
import { SnippetRepository } from "@/backend/repositories/snippetRepository";

export async function GET() {
  try {
    const all = await SnippetRepository.getAll();
    const now = Date.now();

    const trending = [...all]
      .map((s) => {
        const createdMs = new Date(s.createdAt || now).getTime();
        const ageHours = Math.max(1, (now - createdMs) / (1000 * 60 * 60));
        // Velocity formula: engagement weighted inversely against recency
        const rawScore = (s.copyCount || 0) * 3 + (s.starsCount || 0) * 5 + 1;
        const velocity = rawScore / Math.pow(ageHours + 2, 0.5);
        return { snippet: s, velocity };
      })
      .sort((a, b) => b.velocity - a.velocity)
      .map((item) => item.snippet)
      .slice(0, 30);

    return NextResponse.json({ success: true, data: trending });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch trending snippets" },
      { status: 500 }
    );
  }
}

