const mongoose = require("mongoose");
const { env } = require("./env.config");

const connectDatabase = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log(" MongoDB Disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error(" MongoDB Error:", err);
});
module.exports = { connectDatabase };
