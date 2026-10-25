const cloudinary = require("cloudinary").v2;

// Read credentials from .env instead of putting private keys in source code.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

// Multer keeps the selected image in memory, then this helper sends it to Cloudinary.
function uploadImage(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: "wanderlust",
      allowed_formats: ["jpg", "jpeg", "png", "webp"]
    }, function (error, result) {
      if (error) {
        return reject(error);
      }
      if (!result) {
        return reject(new Error("Cloudinary did not return an uploaded image."));
      }
      resolve({ url: result.secure_url, filename: result.public_id });
    });
    stream.end(file.buffer);
  });
}

module.exports = { cloudinary, uploadImage };
