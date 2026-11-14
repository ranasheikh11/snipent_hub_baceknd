import { UserModel } from "@/backend/models/User";
import connectDB from "@/backend/config/db";

export class YouTubeService {
  static async getValidToken(userId: string): Promise<string | null> {
    await connectDB();
    const user = await UserModel.findById(userId);
    if (!user || !user.googleRefreshToken) return user?.googleAccessToken || null;

    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          refresh_token: user.googleRefreshToken,
          grant_type: "refresh_token",
        }),
      });
      const data = await res.json();
      if (data.access_token) {
        user.googleAccessToken = data.access_token;
        await user.save();
        return data.access_token;
      }
    } catch {
      return user.googleAccessToken || null;
    }
    return user.googleAccessToken || null;
  }

  static async fetchMyPlaylists(accessToken: string) {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) throw new Error("Failed to fetch YouTube playlists");
    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.snippet?.title || "Untitled Playlist",
      description: item.snippet?.description || "",
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      itemCount: item.contentDetails?.itemCount || 0,
      channelTitle: item.snippet?.channelTitle || "",
    }));
  }

  static async fetchPlaylistVideos(accessToken: string, playlistId: string) {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) throw new Error("Failed to fetch playlist items");
    const data = await res.json();
    return (data.items || [])
      .filter((item: any) => item.contentDetails?.videoId)
      .map((item: any, idx: number) => ({
        title: item.snippet?.title || `Lecture ${idx + 1}`,
        videoId: item.contentDetails.videoId,
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
        position: idx + 1,
      }));
  }
}

