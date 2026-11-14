import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/backend/config/db";
import { PackageModel } from "@/backend/models/Package";

export async function GET() {
  try {
    await connectToDatabase();
    const docs = await PackageModel.find().sort({ starsCount: -1 }).lean();
    const data = docs.map((d: any) => ({
      id: d._id.toString(),
      slug: d.slug,
      title: d.title,
      description: d.description,
      technology: d.technology,
      category: d.category,
      tags: d.tags || [],
      author: d.author,
      starsCount: d.starsCount || 0,
      snippetIds: d.snippetIds || [],
    }));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    if (!body.title || !body.technology) {
      return NextResponse.json(
        { success: false, message: "Title and technology are required" },
        { status: 400 }
      );
    }
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const created = await PackageModel.create({ ...body, slug });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create package" },
      { status: 500 }
    );
  }
}
