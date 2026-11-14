import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/backend/config/db";
import { CommunityModel } from "@/backend/models/Community";
import { SnippetModel } from "@/backend/models/Snippet";
import mongoose from "mongoose";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { slug: id.toLowerCase() }] }
      : { slug: id.toLowerCase() };

    const doc = await CommunityModel.findOne(query).lean();
    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Community space not found" },
        { status: 404 }
      );
    }

    const hashtag = doc.hashtag || `#${doc.slug}`;
    const cleanTag = hashtag.replace(/^#/, "").toLowerCase();

    const snippetsCount = await SnippetModel.countDocuments({
      tags: {
        $elemMatch: {
          $in: [
            new RegExp(`^${hashtag}$`, "i"),
            new RegExp(`^${cleanTag}$`, "i"),
            new RegExp(`^#${cleanTag}$`, "i"),
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: doc._id.toString(),
        name: doc.name,
        slug: doc.slug,
        hashtag,
        description: doc.description || "",
        icon: doc.icon || "🚀",
        creatorName: doc.creatorName || "Rana Sheikh",
        membersCount: doc.membersCount || 1,
        members: doc.members || [],
        snippetsCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch community" },
      { status: 500 }
    );
  }
}

