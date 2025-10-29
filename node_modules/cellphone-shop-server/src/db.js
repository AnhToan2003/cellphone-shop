import mongoose from "mongoose";

mongoose.set("strictQuery", true);

let cachedConnection = null;

export const connectDB = async (uri = process.env.MONGODB_URI) => {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  cachedConnection = await mongoose.connect(uri, {
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
