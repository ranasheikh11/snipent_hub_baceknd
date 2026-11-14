import { CourseRepository } from "@/backend/repositories/courseRepository";
import { YouTubeService } from "./youtubeService";
import { ICourse } from "@/backend/models/Course";

export class CourseService {
  static async listCourses(technology?: string, difficulty?: string, search?: string) {
    const filter: Record<string, any> = { isPublic: true };
    if (technology && technology !== "ALL") filter.technology = new RegExp(`^${technology}$`, "i");
    if (difficulty) filter.difficulty = new RegExp(`^${difficulty}$`, "i");
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }
    return CourseRepository.getAll(filter);
  }

  static async getCourse(slugOrId: string) {
    if (slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      const byId = await CourseRepository.getById(slugOrId);
      if (byId) return byId;
    }
    return CourseRepository.getBySlug(slugOrId);
  }

  static async createCourseFromYouTube(
    userId: string,
    userName: string,
    data: {
      playlistId: string;
      title: string;
      description?: string;
      technology: string;
      category?: string;
      difficulty?: "Beginner" | "Intermediate" | "Advanced";
      tags?: string[];
      thumbnail?: string;
      channelTitle?: string;
    }
  ): Promise<ICourse> {
    const token = await YouTubeService.getValidToken(userId);
    if (!token) throw new Error("YouTube account not connected. Please connect YouTube first.");

    const lectures = await YouTubeService.fetchPlaylistVideos(token, data.playlistId);
    if (!lectures.length) throw new Error("Selected playlist contains no public videos");

    const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    return CourseRepository.create({
      title: data.title,
      slug: uniqueSlug,
      description: data.description || "",
      thumbnail: data.thumbnail || lectures[0]?.thumbnail || "",
      technology: data.technology,
      category: data.category || "Development",
      difficulty: data.difficulty || "Beginner",
      youtubePlaylistId: data.playlistId,
      channelTitle: data.channelTitle || "",
      author: userName,
      authorId: userId,
      lectures,
      tags: data.tags || [data.technology],
      isPublic: true,
    });
  }
}

