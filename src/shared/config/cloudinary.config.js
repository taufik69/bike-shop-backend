require("dotenv").config();
const { env } = require("./env.config");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: env.CLOUDINARY_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SCERECT,
  secure: true,
});

const cloudinaryFileUpload = async (localFilePath) => {
  if (!localFilePath) {
    throw new Error("localFilePath is required");
  }

  const result = await cloudinary.uploader.upload(localFilePath, {
    resource_type: "image",
  });

  const optimizedUrl = cloudinary.url(result.public_id, {
    fetch_format: "auto",
    quality: "auto",
    transformation: [{ width: 1024, crop: "limit" }],
  });
  console.log("Cloudinary Upload Result:", result.url);
  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    optimized_url: optimizedUrl,
  };
};

// delete cloudinary

const deleteCloudinaryFile = async (publicId) => {
  if (!publicId) return null;

  try {
    const result = await cloudinary.api.delete_resources([publicId], {
      type: "upload",
      resource_type: "image",
    });
    console.log("Cloudinary Delete Result:", result);

    return result;
  } catch (error) {
    console.error("Cloudinary Delete Error:", error.message);
    return null;
  }
};
module.exports = { cloudinaryFileUpload, cloudinary, deleteCloudinaryFile };
