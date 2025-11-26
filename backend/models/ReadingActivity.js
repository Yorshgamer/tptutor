// models/ReadingActivity.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const readingActivitySchema = new Schema(
  {
    _id: { type: String, required: true },  // 👈 string, no ObjectId

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    minScore: {
      type: Number,
      default: 14,
    },
  },
  {
    timestamps: true,
  }
);

export const ReadingActivity = model(
  "ReadingActivity",
  readingActivitySchema
);
