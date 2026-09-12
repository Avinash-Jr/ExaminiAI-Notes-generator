import multer from "multer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  // Keep unsupported files available to the controller so it can report the
  // specific reference error and continue with direct generation.
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      req.referenceUploadError = {
        code: err.code,
        message:
          "Reference upload failed: file too large. Maximum 10 MB per file.",
      };
      req.files = [];
      return next();
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      req.referenceUploadError = {
        code: err.code,
        message: `Reference upload failed: too many files. Maximum ${MAX_FILES} files.`,
      };
      req.files = [];
      return next();
    }
    return res.status(400).json({ error: err.message });
  }
  if (err?.statusCode === 400) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
};
