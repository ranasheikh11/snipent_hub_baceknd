import { CourseModel, ICourse } from "@/backend/models/Course";
import connectDB from "@/backend/config/db";

export class CourseRepository {
  static async getAll(filter: Record<string, any> = {}): Promise<ICourse[]> {
    await connectDB();
    return CourseModel.find(filter).sort({ createdAt: -1 }).lean() as unknown as ICourse[];
  }

  static async getById(id: string): Promise<ICourse | null> {
    await connectDB();
    return CourseModel.findById(id).lean() as unknown as ICourse | null;
  }

  static async getBySlug(slug: string): Promise<ICourse | null> {
    await connectDB();
    return CourseModel.findOne({ slug: slug.toLowerCase() }).lean() as unknown as ICourse | null;
  }

  static async create(data: Partial<ICourse>): Promise<ICourse> {
    await connectDB();
    const doc = new CourseModel(data);
    return (await doc.save()).toObject() as ICourse;
  }

  static async update(id: string, data: Partial<ICourse>): Promise<ICourse | null> {
    await connectDB();
    return CourseModel.findByIdAndUpdate(id, data, { new: true }).lean() as unknown as ICourse | null;
  }

  static async delete(id: string): Promise<boolean> {
    await connectDB();
    const res = await CourseModel.findByIdAndDelete(id);
    return Boolean(res);
  }

  static async incrementEnrollment(id: string): Promise<void> {
    await connectDB();
    await CourseModel.findByIdAndUpdate(id, { $inc: { studentsCount: 1 } });
  }
}

