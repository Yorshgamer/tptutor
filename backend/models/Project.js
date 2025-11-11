// models/Project.js
import mongoose, { Schema } from "mongoose";
const ProjectSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["pending","in_progress","done"], default: "in_progress" },
  tags: { type: [String], default: [] },
}, { timestamps: true });

export const Project = mongoose.model("Project", ProjectSchema);