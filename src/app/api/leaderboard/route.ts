import { NextResponse } from "next/server";
import { connectToDatabase } from "@/backend/config/db";
import { SnippetModel } from "@/backend/models/Snippet";
import { UserModel } from "@/backend/models/User";

export async function GET() {
  try {
    await connectToDatabase();
    const [users, snippets] = await Promise.all([
      UserModel.find().select("name avatar githubUsername bio").lean(),
      SnippetModel.find({ isPublic: true }).lean(),
    ]);

    // Build map for each user
    const leaderboard = users.map((u: any) => {
      const uId = u._id.toString();
      const uName = (u.name || "").toLowerCase().trim();

      const userSnippets = snippets.filter((s: any) => {
        const matchId = s.authorId && s.authorId.toString() === uId;
        const matchName = (s.author || "").toLowerCase().trim() === uName;
        return matchId || matchName;
      });

      const totalStars = userSnippets.reduce((sum: number, s: any) => sum + (s.starsCount || 0), 0);
      const totalCopies = userSnippets.reduce((sum: number, s: any) => sum + (s.copyCount || 0), 0);
      const techs = Array.from(new Set(userSnippets.map((s: any) => s.technology).filter(Boolean))).slice(0, 3);
      const score = totalStars * 5 + totalCopies * 2 + userSnippets.length * 10;

      return {
        author: u.name,
        authorId: uId,
        avatar: u.avatar || "",
        githubUsername: u.githubUsername || "",
        totalStars,
        totalCopies,
        snippetCount: userSnippets.length,
        topTech: techs,
        score,
      };
    });

    // Sort by dynamic score descending
    const sorted = leaderboard
      .sort((a, b) => b.score - a.score)
      .map((dev, idx) => ({
        ...dev,
        rank: idx + 1,
        badge:
          idx === 0
            ? "Grand Architect"
            : idx === 1
            ? "Code Artisan"
            : idx === 2
            ? "Vault Specialist"
            : "Core Contributor",
      }));

    return NextResponse.json({ success: true, data: sorted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
