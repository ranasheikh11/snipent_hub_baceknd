import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPackageItem {
  id: string;
  title: string;
  description: string;
  technology: string;
  category: string;
  tags: string[];
  snippetIds: string[];
  snippetsCount: number;
  author: string;
  starsCount: number;
}

export interface IPackageDoc extends Document {
  title: string;
  slug: string;
  description: string;
  technology: string;
  category: string;
  tags: string[];
  snippetIds: string[];
  author: string;
  starsCount: number;
}

const PackageSchema = new Schema<IPackageDoc>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    technology: { type: String, required: true },
    category: { type: String, default: "Architecture" },
    tags: [{ type: String }],
    snippetIds: [{ type: String }],
    author: { type: String, default: "SnippetHub Team" },
    starsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const PackageModel: Model<IPackageDoc> =
  mongoose.models.Package || mongoose.model<IPackageDoc>("Package", PackageSchema);

