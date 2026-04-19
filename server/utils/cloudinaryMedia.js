const { Readable } = require("stream");
const cloudinary = require("cloudinary").v2;

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);

function isConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function ensureConfigured() {
  if (!isConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
}

if (isConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function cloudinaryPublicIdFromUrl(url) {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) return null;
  const pathPart = url.split("?")[0];
  const marker = "/upload/";
  const idx = pathPart.indexOf(marker);
  if (idx === -1) return null;
  const rest = pathPart.slice(idx + marker.length);
  const segments = rest.split("/").filter(Boolean);
  const kept = segments.filter((s) => !/^v\d+$/i.test(s) && !s.includes(","));
  if (!kept.length) return null;
  const joined = kept.join("/");
  if (!joined.includes(".")) return null;
  return joined.replace(/\.[^/.]+$/, "");
}

function uploadImageBuffer(buffer, options = {}) {
  ensureConfigured();
  const { folder = "eventer/misc" } = options;
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    Readable.from(buffer).pipe(stream);
  });
}

async function destroyCloudinaryImage(url) {
  const publicId = cloudinaryPublicIdFromUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (e) {
    console.warn("Cloudinary destroy failed:", e.message);
  }
}

module.exports = {
  cloudinary,
  IMAGE_MIMES,
  isConfigured,
  ensureConfigured,
  uploadImageBuffer,
  destroyCloudinaryImage,
  cloudinaryPublicIdFromUrl,
};
