import { app } from "./app.js";
import { connectDB } from "./db.js";
import { ensureReviewIndexes } from "./services/indexMaintenance.service.js";

const port = Number(process.env.PORT) || 5000;

try {
  await connectDB();
  await ensureReviewIndexes();

  const server = app.listen(port, () => {
    console.log(`Ngọc Triết Store API running on port ${port}`);
  });

  server.on("error", (error) => {
    console.error("API server failed:", error);
    process.exitCode = 1;
  });
} catch (error) {
  console.error("API startup failed:", error.message);
  process.exitCode = 1;
}
