import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/backend/config/db";
import { UserModel, IUser } from "@/backend/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "devvault-jwt-super-secret-key-2026";

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  githubUsername?: string;
  avatar?: string;
}

export class AuthService {
  static signToken(user: IUser): string {
    return jwt.sign(
      { id: user._id.toString(), name: user.name, email: user.email, avatar: user.avatar },
      JWT_SECRET,
      { expiresIn: "30d" }
    );
  }

  static verifyToken(token: string): UserPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch {
      return null;
    }
  }

  static async register(name: string, email: string, password: string):Promise<{ user: UserPayload; token: string }> {
    await connectToDatabase();
    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) throw new Error("Email already registered");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await UserModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    });

    const token = this.signToken(user);
    return {
      user: { id: user._id.toString(), name: user.name, email: user.email, avatar: user.avatar },
      token,
    };
  }

  static async login(email: string, password: string): Promise<{ user: UserPayload; token: string }> {
    await connectToDatabase();
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) throw new Error("Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new Error("Invalid email or password");

    const token = this.signToken(user);
    return {
      user: { id: user._id.toString(), name: user.name, email: user.email, avatar: user.avatar },
      token,
    };
  }

  static async socialLogin(p: {
    provider: "github" | "google";
    providerId: string;
    name: string;
    email: string;
    username?: string;
    avatar?: string;
  }): Promise<{ user: UserPayload; token: string }> {
    await connectToDatabase();
    const isGh = p.provider === "github";
    const query = isGh
      ? { $or: [{ githubId: p.providerId }, { email: p.email.toLowerCase() }] }
      : { $or: [{ googleId: p.providerId }, { email: p.email.toLowerCase() }] };

    let user = await UserModel.findOne(query);
    if (!user) {
      user = await UserModel.create({
        name: p.name || p.username || "User",
        email: p.email.toLowerCase(),
        [isGh ? "githubId" : "googleId"]: p.providerId,
        githubUsername: p.username,
        avatar: p.avatar,
      });
    } else {
      if (isGh) {
        user.githubId = p.providerId;
        user.githubUsername = p.username;
      } else {
        user.googleId = p.providerId;
      }
      if (!user.avatar && p.avatar) user.avatar = p.avatar;
      await user.save();
    }

    return {
      user: { id: user._id.toString(), name: user.name, email: user.email, avatar: user.avatar, githubUsername: user.githubUsername },
      token: this.signToken(user),
    };
  }

  static githubLoginOrRegister(p: { githubId: string; name: string; email: string; username: string; avatar: string }) {
    return this.socialLogin({ provider: "github", providerId: p.githubId, ...p });
  }

  static googleLoginOrRegister(p: { googleId: string; name: string; email: string; avatar: string }) {
    return this.socialLogin({ provider: "google", providerId: p.googleId, ...p });
  }
}

