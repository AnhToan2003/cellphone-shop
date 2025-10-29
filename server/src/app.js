// server/src/app.js
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import helmet from "helmet";          // ✅ CHỈ import 1 lần
import morgan from "morgan";

import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import bannerRoutes from "./routes/banner.routes.js";
import { publicBasePath, uploadsBasePath } from "./middleware/upload.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { seedAdmin } from "./seed/seedAdmin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../../client/dist");
const indexHtmlPath = path.join(clientDistPath, "index.html");
const publicRoot = publicBasePath;
const uploadsRoot = uploadsBasePath;

const ensureDirectories = () => {
  [publicRoot, uploadsRoot, path.join(uploadsRoot, "products"), path.join(uploadsRoot, "banners")]
    .forEach((dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });
};
ensureDirectories();

export const createServer = () => {
  const app = express();

  // ✅ CSP DEV chỉ 1 lần. Browser CHỈ truy cập http://localhost:5000
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "img-src": ["'self'", "data:", "blob:", "https:"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        // ⚠️ Chỉ self + 5000 để không “đòi” thêm host khác (5173, 3000…)
        "connect-src": ["'self'", "http://localhost:5000", "https:"],
        "frame-src": ["'self'"],
      },
    },
  }));

  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

  // APIs
  app.get("/api/health", (req, res) => res.json({ success: true, app: "Cellphone Shop", status: "ok", timestamp: new Date().toISOString() }));
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/banners", bannerRoutes);

  // Demo banner JSON (giữ/ bỏ tùy bạn)
  app.get("/api/banner", (req, res) => {
    res.json({
      sentence: "Welcome to Cellphone Shop",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80",
    });
  });

  // Static assets + client build trên CÙNG cổng 5000
  app.use(express.static(publicRoot));
  app.use("/uploads", express.static(uploadsRoot));
  app.use(express.static(clientDistPath));

  // SPA fallback
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    if (!fs.existsSync(indexHtmlPath)) {
      return res.status(503).send("Client build not found. Run `npm run build:client` first.");
    }
    return res.sendFile(indexHtmlPath, (err) => err && next(err));
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

export const app = createServer();

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;       // ✅ Cố định 5000
  connectDB()
    .then(async () => {
      await seedAdmin();
      app.listen(PORT, () => {
        console.log(`🚀 Cellphone Shop running at http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("❌ Failed to connect to MongoDB:", error.message);
      process.exit(1);
    });
}

export default app;
