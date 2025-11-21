import mongoose from "mongoose";

mongoose.set("strictQuery", true);

const DEFAULT_URI = "mongodb://127.0.0.1:27017/cellphoneshop";

let cachedConnection = null;

export const connectDB = async (uri = process.env.MONGODB_URI) => {
  if (cachedConnection) {
    return cachedConnection;
  }

  const resolvedUri = uri || DEFAULT_URI;

  if (!resolvedUri) {
    throw new Error("MONGODB_URI is not defined");
  }

  cachedConnection = await mongoose.connect(resolvedUri, {
    serverSelectionTimeoutMS: 5000,
  });

  return cachedConnection;
};

export const disconnectDB = async () => {
  if (!cachedConnection) {
    return;
  }

  await mongoose.disconnect();
  cachedConnection = null;
};
