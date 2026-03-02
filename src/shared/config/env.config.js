require("dotenv").config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "developement",
  PORT: parseInt(process.env.PORT || "5000", 10),
  MONGODB_URI: getEnvVariable("MONGODB_URI"),
  API_VERSION: getEnvVariable("API_VERSION"),
  REDIS_URL: getEnvVariable("REDIS_URL"),
  CLOUDINARY_NAME: getEnvVariable("CLOUDINARY_NAME"),
  CLOUDINARY_API_KEY: getEnvVariable("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SCERECT: getEnvVariable("CLOUDINARY_API_SCERECT"),
};

function getEnvVariable(key) {
  return process.env[key] || "";
}

module.exports = { env };
