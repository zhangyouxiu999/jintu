import mongoose from "mongoose";
import logger from "@/lib/logger";

/**
 * 数据库连接地址：
 * - 本地开发：未设置时使用 mongodb://localhost:27017/school_cms（本地或本机 Docker 映射 27017）
 * - 本地 Docker：docker-compose 注入 MONGODB_URI=mongodb://mongodb:27017/school_cms（同一网络内服务名 mongodb）
 * - 绿联 NAS 部署：同上，compose 内 app 与 mongodb 同网段，使用 mongodb://mongodb:27017/school_cms
 */
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/school_cms";

// 生产环境必须显式配置 MONGODB_URI，避免误用默认地址
if (process.env.NODE_ENV === "production" && !process.env.MONGODB_URI) {
  throw new Error(
    "Please define MONGODB_URI in environment when NODE_ENV=production"
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = global as typeof globalThis & {
  mongoose?: MongooseCache;
};

let cached = globalWithMongoose.mongoose;

if (!cached) {
  cached = globalWithMongoose.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };

    const connectFn =
      (mongoose as any).connect ||
      ((mongoose as any).default && (mongoose as any).default.connect);

    if (typeof connectFn !== "function") {
      throw new Error("Mongoose connect function not found");
    }

    cached!.promise = connectFn.call(mongoose, MONGODB_URI, opts).then(
      (mongooseInstance: typeof mongoose) => {
        if (process.env.NODE_ENV !== "production") {
          logger.info("=> MongoDB connected successfully");
        }
        return mongooseInstance;
      }
    );
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    logger.error({ err: e }, "=> MongoDB connection error");
    throw e;
  }

  return cached!.conn!;
}

export default dbConnect;

