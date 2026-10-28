import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

import { connectDB, disconnectDB } from "../db.js";
import { seedAdmin } from "./seedAdmin.js";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env") });

try {
  await connectDB();
  await seedAdmin();
} catch (error) {
  console.error("Admin seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
