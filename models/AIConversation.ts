import mongoose, { Schema, model, models, type Document } from "mongoose";

export interface IAIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ICollectedData {
  projectType?: string;
  description?: string;
  features?: string[];
  designStyle?: string;
  budget?: string;
  timeline?: string;
  references?: string[];
}

export interface IAIConversation extends Document {
  _id: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  sessionId: string;
  messages: IAIMessage[];
  collectedData: ICollectedData;
  isComplete: boolean;
  orderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AIConversationSchema = new Schema<IAIConversation>(
  {
    clientId:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: String, unique: true, required: true },
    messages: [
      {
        role:      { type: String, enum: ["user", "assistant"], required: true },
        content:   { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    collectedData: {
      projectType:  { type: String },
      description:  { type: String },
      features:     [{ type: String }],
      designStyle:  { type: String },
      budget:       { type: String },
      timeline:     { type: String },
      references:   [{ type: String }],
    },
    isComplete: { type: Boolean, default: false },
    orderId:    { type: Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: true }
);

export const AIConversation = models.AIConversation ?? model<IAIConversation>("AIConversation", AIConversationSchema);
