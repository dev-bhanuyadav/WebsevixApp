import mongoose, { Schema, model, models, type Document } from "mongoose";

export interface IAdminNote extends Document {
  _id: mongoose.Types.ObjectId;
  targetType: "user" | "order";
  targetId: mongoose.Types.ObjectId;
  note: string;
  addedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdminNoteSchema = new Schema<IAdminNote>(
  {
    targetType: { type: String, enum: ["user", "order"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    note: { type: String, required: true, trim: true },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AdminNoteSchema.index({ targetType: 1, targetId: 1 });

export const AdminNote =
  models.AdminNote ?? model<IAdminNote>("AdminNote", AdminNoteSchema);
