const multer = require("multer");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public");
    },

    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
});

module.exports = upload;
