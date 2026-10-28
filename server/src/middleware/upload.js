import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { del, put } from "@vercel/blob";

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

const useMemoryStorage =
  process.env.VERCEL === "1" || Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const maxImageSize =
  process.env.VERCEL === "1" ? 4 * 1024 * 1024 : 5 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

const createStorage = (subFolder) => {
  if (useMemoryStorage) {
    return multer.memoryStorage();
  }

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
  limits: { fileSize: maxImageSize },
});

export const bannerUpload = multer({
  storage: createStorage("banners"),
  fileFilter,
  limits: { fileSize: maxImageSize },
});

export const saveUploadedImage = async (file, subFolder) => {
  if (!file) return "";

  if (file.buffer) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      const error = new Error("Image storage is not configured for this deployment");
      error.statusCode = 503;
      throw error;
    }

    const ext = path.extname(file.originalname || "image").toLowerCase() || ".jpg";
    const key = `${subFolder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const blob = await put(key, file.buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.mimetype,
    });
    return blob.url;
  }

  return `/uploads/${subFolder}/${file.filename}`;
};

export const deleteUploadedImage = async (imageUrl, subFolder) => {
  if (!imageUrl || typeof imageUrl !== "string") return;

  if (/^https?:\/\//i.test(imageUrl)) {
    const hostname = new URL(imageUrl).hostname;
    if (
      process.env.BLOB_READ_WRITE_TOKEN &&
      (hostname === "public.blob.vercel-storage.com" ||
        hostname.endsWith(".public.blob.vercel-storage.com"))
    ) {
      await del(imageUrl);
    }
    return;
  }

  const filename = path.basename(imageUrl);
  const localPath = path.join(uploadsRoot, subFolder, filename);
  await fs.promises.unlink(localPath).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
};

export const uploadsBasePath = uploadsRoot;
export const publicBasePath = publicRoot;
