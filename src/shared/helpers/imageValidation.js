const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { ApiError } = require("@/shared/utils/apiError.utils");
const path = require("path");
const fs = require("fs");
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const validateImageFiles = ({
  req,
  next,
  required = false,
  maxCount = 10,
  maxSizeMB = 1,
  fieldName = "image",
}) => {
  const files = req?.files?.[fieldName];

  if (required) {
    if (!req.files || !files || !Array.isArray(files) || files.length === 0) {
      next(
        new ApiError(
          "Please provide at least one image",
          HTTP_STATUS.BAD_REQUEST,
        ),
      );
      return null;
    }
  }

  // image
  if (!files || !Array.isArray(files) || files.length === 0) {
    return [];
  }

  // fieldname check
  if (files[0].fieldname !== fieldName) {
    files.forEach((f) => {
      fs.unlinkSync(f.path);
    });
    next(
      new ApiError(
        `Please provide a valid image fieldName (${fieldName})`,
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
    return null;
  }

  //   check extention

  const invalidFile = files.find((f) => {
    const ext = path.extname(f.originalname).toLowerCase();
    return !allowedExtensions.includes(ext);
  });

  if (invalidFile) {
    // delete all uploaded files (optional but recommended)
    files.forEach((f) => {
      if (fs.existsSync(f.path)) {
        fs.unlinkSync(f.path);
      }
    });

    return next(
      new ApiError(
        `Only ${allowedExtensions.join(", ")} images are allowed`,
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
  }

  // max count
  if (files.length > maxCount) {
    files.forEach((f) => {
      fs.unlinkSync(f.path);
    });
    next(
      new ApiError(
        `You can upload a maximum of ${maxCount} images`,
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
    return null;
  }

  // size check (each)
  const MAX_SIZE = maxSizeMB * 1024 * 1024;
  const tooLarge = files.find((f) => f.size > MAX_SIZE);
  if (tooLarge) {
    files.forEach((f) => {
      fs.unlinkSync(f.path);
    });
    next(
      new ApiError(
        `Image size should be less than ${maxSizeMB}MB`,
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
    return null;
  }

  return files;
};

module.exports = { validateImageFiles };
