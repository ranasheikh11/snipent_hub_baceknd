import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/backend/config/db";
import { CommunityModel } from "@/backend/models/Community";
import { SnippetModel } from "@/backend/models/Snippet";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const commQuery = isObjectId
      ? { $or: [{ _id: id }, { slug: id.toLowerCase() }] }
      : { slug: id.toLowerCase() };

    const comm = await CommunityModel.findOne(commQuery).lean();
    if (!comm) {
      return NextResponse.json({ success: false, message: "Community not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "6", 10)));
    const sort = searchParams.get("sort") || "latest";
    const category = searchParams.get("category") || "";
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    const hashtag = comm.hashtag || `#${comm.slug}`;
    const cleanTag = hashtag.replace(/^#/, "").toLowerCase();

    // Query snippets with this tag
    const filter: any = {
      isPublic: true,
      tags: {
        $elemMatch: {
          $in: [
            new RegExp(`^${hashtag}$`, "i"),
            new RegExp(`^${cleanTag}$`, "i"),
            new RegExp(`^#${cleanTag}$`, "i"),
          ],
        },
      },
    };

    if (category && category !== "ALL") {
      filter.category = new RegExp(`^${category}$`, "i");
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { technology: { $regex: q, $options: "i" } },
        { "files.code": { $regex: q, $options: "i" } },
      ];
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === "popular") sortOption = { starsCount: -1, copyCount: -1 };
    else if (sort === "discussed") sortOption = { "questions.0": -1, createdAt: -1 };

    const total = await SnippetModel.countDocuments(filter);
    const docs = await SnippetModel.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const data = docs.map((doc: any) => ({
      id: doc._id.toString(),
      title: doc.title,
      description: doc.description || "",
      category: doc.category,
      technology: doc.technology,
      level: doc.level || "Beginner",
      tags: doc.tags || [],
      files: doc.files || [],
      author: doc.author || "Developer",
      authorId: doc.authorId || "",
      isPublic: doc.isPublic ?? true,
      copyCount: doc.copyCount || 0,
      starsCount: doc.starsCount || 0,
      starredBy: doc.starredBy || [],
      questions: doc.questions || [],
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch community snippets" },
      { status: 500 }
    );
  }
}

