import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "server", "public", "uploads");
const outputRoot = path.join(root, "client", "dist", "uploads");
const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const collectImages = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectImages(absolutePath)));
    } else if (supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(absolutePath);
    }
  }

  return files;
};

const images = await collectImages(sourceRoot);
let outputBytes = 0;

for (const sourcePath of images) {
  const relativePath = path.relative(sourceRoot, sourcePath);
  const targetPath = path.join(
    outputRoot,
    path.dirname(relativePath),
    `${path.parse(relativePath).name}.webp`
  );
  const maxWidth = relativePath.startsWith(`banners${path.sep}`) ? 1920 : 1200;

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const result = await sharp(sourcePath, { failOn: "error" })
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 78, effort: 4 })
    .toFile(targetPath);

  outputBytes += result.size;
}

console.log(
  `Prepared ${images.length} optimized images (${(outputBytes / 1024 / 1024).toFixed(1)} MB).`
);
