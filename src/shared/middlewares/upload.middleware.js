const multer = require("multer");
const path = require("path");

// Allowed file types

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = path.basename(file.originalname, ext);
    cb(null, `${filename}-${ext}`);
  },
});

const upload = multer({
  storage,
});

module.exports = { upload };
