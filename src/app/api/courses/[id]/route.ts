import { NextRequest, NextResponse } from "next/server";
import { CourseService } from "@/backend/services/courseService";
import { CourseRepository } from "@/backend/repositories/courseRepository";
import { AuthService } from "@/backend/services/authService";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const course = await CourseService.getCourse(id);
    if (!course) return NextResponse.json({ success: false, message: "Course not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: course });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const token = bearer || req.cookies.get("token")?.value;

    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const user = AuthService.verifyToken(token);
    if (!user) return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });

    const course = await CourseService.getCourse(id);
    if (!course) return NextResponse.json({ success: false, message: "Course not found" }, { status: 404 });
    if (course.authorId !== user.id) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });

    const ok = await CourseRepository.delete(id);
    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

