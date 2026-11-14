import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILecture {
  title: string;
  videoId: string;
  thumbnail: string;
  duration?: string;
  position: number;
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  technology: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  youtubePlaylistId: string;
  channelTitle: string;
  author: string;
  authorId: string;
  lectures: ILecture[];
  studentsCount: number;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LectureSchema = new Schema<ILecture>(
  {
    title: { type: String, required: true },
    videoId: { type: String, required: true },
    thumbnail: { type: String, default: "" },
    duration: { type: String, default: "" },
    position: { type: Number, default: 0 },
  },
  { _id: false }
);

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    technology: { type: String, required: true },
    category: { type: String, default: "Development" },
    difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    youtubePlaylistId: { type: String, required: true },
    channelTitle: { type: String, default: "" },
    author: { type: String, required: true },
    authorId: { type: String, required: true },
    lectures: [LectureSchema],
    studentsCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const CourseModel: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);

