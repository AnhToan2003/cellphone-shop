import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");
const publicRoot = path.join(projectRoot, "public");
const uploadsRoot = path.join(publicRoot, "uploads");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

const createStorage = (subFolder) => {
  const destination = path.join(uploadsRoot, subFolder);
  ensureDir(destination);

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${ext}`);
    },
  });
};

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

export const productUpload = multer({
  storage: createStorage("products"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const bannerUpload = multer({
  storage: createStorage("banners"),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadsBasePath = uploadsRoot;
export const publicBasePath = publicRoot;
