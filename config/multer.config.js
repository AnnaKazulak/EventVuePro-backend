const cloudinary = require("./cloudinary.config");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    allowed_formats: ["jpg", "png"],
    folder: "gallery", // The name of the folder in Cloudinary
    // resource_type: "raw", // => this is in case you want to upload other types of files, not just images
  }
});

module.exports = multer({ storage });
