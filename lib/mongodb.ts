import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

// Use a fresh cache object in development (avoids stale failed promises across hot-reloads)
const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };

if (process.env.NODE_ENV !== "production") {
  global._mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI missing in .env.local");
  }

  // Already connected — return cached connection
  if (cached.conn) {
    return cached.conn;
  }

  // Kick off new connection (or reuse in-flight promise)
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 30000,
      })
      .catch((err) => {
        // CRITICAL: clear failed promise so the NEXT request retries instead
        // of returning the same rejected promise forever
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
