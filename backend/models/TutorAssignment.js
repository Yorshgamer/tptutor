// models/TutorAssignment.js
import mongoose, { Schema } from "mongoose";

const TutorAssignmentSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

// Evita duplicados: un teacher no puede tener dos filas con el mismo alumno
TutorAssignmentSchema.index({ teacherId: 1, studentId: 1 }, { unique: true });

export const TutorAssignment = mongoose.model("TutorAssignment", TutorAssignmentSchema);
