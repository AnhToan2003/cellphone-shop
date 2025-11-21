// server/src/app.js
import fs from "fs";
// no side-effect dotenv import; use config with explicit path
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import dns from "dns";
// keep dns if used below; OK to leave as-is otherwise
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors"; // ⭐ THÊM: cho phép frontend gọi API khi dev khác port

import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import bannerRoutes from "./routes/banner.routes.js";
import homeCategoryRoutes from "./routes/homeCategory.routes.js";
import monitorRoutes from "./routes/monitor.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import supportRoutes from "./routes/support.routes.js";
import { publicBasePath, uploadsBasePath } from "./middleware/upload.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { seedAdmin } from "./seed/seedAdmin.js";
import { ensureReviewIndexes } from "./services/indexMaintenance.service.js";
import { startSupportKnowledgeRefresher } from "./services/supportKnowledgeRefresher.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
  console.warn(
    "[env] Missing critical env vars (JWT_SECRET, MONGODB_URI). Check server/.env"
  );
}
try {
  dns.setDefaultResultOrder?.("ipv4first");
} catch (error) {
  console.warn("dns.setDefaultResultOrder not supported:", error.message);
}
const clientDistPath = path.resolve(__dirname, "../../client/dist");
const indexHtmlPath = path.join(clientDistPath, "index.html");
const publicRoot = publicBasePath;
const uploadsRoot = uploadsBasePath;

const ensureDirectories = () => {
  [publicRoot, uploadsRoot, path.join(uploadsRoot, "products"), path.join(uploadsRoot, "banners")]
    .forEach((dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });
};
ensureDirectories();

const parseOrigins = (raw = "") =>
  raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

const matchesOrigin = (origin, allowed) => {
  if (!allowed || !origin) return !origin;
  if (allowed === "*") return true;
  if (allowed.startsWith("*.")) {
    const domain = allowed.slice(1);
    return origin.endsWith(domain);
  }
  return origin === allowed;
};

const serverPort = Number(process.env.PORT) || 5000;
const envOriginSource = process.env.CLIENT_URLS || process.env.CLIENT_URL || "";
const envOrigins = parseOrigins(envOriginSource);
const fallbackOrigins = [
  process.env.CLIENT_URL,
  `http://localhost:${serverPort}`,
  `http://127.0.0.1:${serverPort}`,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];
const allowedOrigins = Array.from(new Set([...envOrigins, ...fallbackOrigins].filter(Boolean)));
if (allowedOrigins.length === 0) {
  allowedOrigins.push(`http://localhost:${serverPort}`);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some((allowed) => matchesOrigin(origin, allowed))) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
};

export const createServer = () => {
  const app = express();

  // ⭐ THÊM: CORS để cho phép client (VD: http://localhost:5173) gọi API
  app.use(cors(corsOptions));

  // ✅ CSP DEV chỉ dùng một lần. Browser chỉ truy cập http://localhost:5000
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
  app.use("/api/home-categories", homeCategoryRoutes);
  app.use("/api/brands", brandRoutes);
  app.use("/api/monitor", monitorRoutes);
  app.use("/api/support", supportRoutes);

  // Demo banner JSON (giữ hoặc bỏ tùy bạn)
  app.get("/api/banner", (req, res) => {
    res.json({
      sentence: "Welcome to Cellphone Shop",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80",
    });
  });

  // Static assets + client build phục vụ cùng cổng 5000
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

const attachServerErrorHandler = (server, port) => {
  server.on("error", (error) => {
    if (error?.code === "EADDRINUSE") {
      console.error(`[server] Port ${port} is already in use. Stop the other process or free the port before starting the API.`);
      console.error(`Hint: run "npx kill-port ${port}" or terminate lingering node processes.`);
      process.exit(1);
    }
    console.error("[server] Unexpected HTTP server error:", error);
    process.exit(1);
  });
};

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;       // ? C? d?nh 5000
  connectDB()
    .then(async () => {
      await seedAdmin();
      await ensureReviewIndexes();
      startSupportKnowledgeRefresher();
      const serverInstance = app.listen(PORT, () => {
        console.log(`?? Cellphone Shop running at http://localhost:${PORT}`);
      });
      attachServerErrorHandler(serverInstance, PORT);
    })
    .catch((error) => {
      console.error("?? Failed to connect to MongoDB:", error.message);
      process.exit(1);
    });
}

export default app;
