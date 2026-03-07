export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { Notification } from "@/models/Notification";
import mongoose from "mongoose";

interface NotificationBody {
  targetType: "all" | "user" | "segment";
  targetUsers?: string[];
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "promo";
  channels?: ("in-app" | "email" | "push")[];
  scheduledAt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAdmin(request);
    await connectDB();

    const body = (await request.json()) as NotificationBody;
    const { targetType, targetUsers, title, message, type, channels, scheduledAt } = body;

    if (!title?.trim()) return jsonResponse({ error: "title is required" }, 400);
    if (!message?.trim()) return jsonResponse({ error: "message is required" }, 400);
    if (!["all", "user", "segment"].includes(targetType)) {
      return jsonResponse({ error: "Invalid targetType" }, 400);
    }
    if (!["info", "success", "warning", "promo"].includes(type)) {
      return jsonResponse({ error: "Invalid notification type" }, 400);
    }

    const validTargetUsers = (targetUsers ?? [])
      .filter((uid) => mongoose.Types.ObjectId.isValid(uid) && uid.length === 24)
      .map((uid) => new mongoose.Types.ObjectId(uid));

    const notification = await Notification.create({
      targetType,
      targetUsers: validTargetUsers,
      title: title.trim(),
      message: message.trim(),
      type,
      channels: channels ?? ["in-app"],
      sentBy: new mongoose.Types.ObjectId(payload.userId),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      sentAt: new Date(),
      status: "sent",
    });

    return jsonResponse({ success: true, notification }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);
    await connectDB();

    const notifications = await Notification.find()
      .populate("sentBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return jsonResponse({ notifications });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return jsonResponse({ error: message }, status);
  }
}
