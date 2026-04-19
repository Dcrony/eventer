const multer = require("multer");
const { IMAGE_MIMES } = require("../utils/cloudinaryMedia");

const imageFileFilter = (req, file, cb) => {
  if (IMAGE_MIMES.has(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(
    new Error(
      "Only image files are allowed (JPEG, PNG, WebP, GIF, AVIF, HEIC). Video uploads are not accepted.",
    ),
  );
};

const uploadImageMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

module.exports = { uploadImageMemory };
