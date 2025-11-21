// models/ReadingResult.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const readingResultSchema = new Schema(
  {
    // 🔹 IMPORTANTE: ahora es String, porque ReadingActivity._id es String
    activityId: {
      type: String,
      ref: "ReadingActivity",
      required: true,
    },

    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mcScore: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
    },

    openScore: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
    },

    totalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
    },

    reflection: {
      type: String,
      default: "",
    },

    rawText: {
      type: String,
      required: true,
    },

    answers: {
      type: Schema.Types.Mixed, // para guardar el mapa de respuestas
    },

    passed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const ReadingResult = model("ReadingResult", readingResultSchema);
