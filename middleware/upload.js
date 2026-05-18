const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024,
    files: 24,
  },
});

module.exports = upload;
