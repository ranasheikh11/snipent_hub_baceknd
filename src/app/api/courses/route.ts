import { NextRequest, NextResponse } from "next/server";
import { CourseService } from "@/backend/services/courseService";
import { AuthService } from "@/backend/services/authService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tech = searchParams.get("tech") || undefined;
    const diff = searchParams.get("difficulty") || undefined;
    const q = searchParams.get("q") || undefined;

    const courses = await CourseService.listCourses(tech, diff, q);
    return NextResponse.json({ success: true, data: courses });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = bearer || req.cookies.get("token")?.value;

    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const user = AuthService.verifyToken(token);
    if (!user) return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });

    const body = await req.json();
    if (!body.playlistId || !body.title || !body.technology) {
      return NextResponse.json({ success: false, message: "playlistId, title, and technology are required" }, { status: 400 });
    }

    const course = await CourseService.createCourseFromYouTube(user.id, user.name, body);
    return NextResponse.json({ success: true, data: course }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

