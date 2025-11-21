// models/Project.js
import mongoose, { Schema } from "mongoose";

const ProjectSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "in_progress", "done"],
      default: "in_progress",
    },
    tags: { type: [String], default: [] },

    // 🆕 campos para seguimiento de progreso
    totalActivities: {
      type: Number,
      default: 0, // cantidad total de actividades de lectura
    },
    completedActivities: {
      type: Number,
      default: 0, // actividades aprobadas por el alumno
    },
    progressPercent: {
      type: Number,
      default: 0, // (completedActivities / totalActivities) * 100
    },
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", ProjectSchema);
