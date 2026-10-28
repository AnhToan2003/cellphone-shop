import mongoose from "mongoose";

mongoose.set("strictQuery", true);

const DEFAULT_URI = "mongodb://127.0.0.1:27017/cellphoneshop";

let connectionPromise = null;

export const connectDB = async (uri = process.env.MONGODB_URI) => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connectionPromise) return connectionPromise;

  const resolvedUri = uri ||
    (process.env.NODE_ENV === "production" ? "" : DEFAULT_URI);

  if (!resolvedUri) {
    throw new Error("MONGODB_URI is not defined");
  }

  connectionPromise = mongoose.connect(resolvedUri, {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE) || 10,
  });
  try {
    const connected = await connectionPromise;
    return connected.connection;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  connectionPromise = null;
};
