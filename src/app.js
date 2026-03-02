const { HTTP_STATUS } = require("@/shared/config/constant.config");
const ApiResponse = require("@/shared/utils/apiResponse.utils");
const {
  globalErrorHandeler,
  notFound,
} = require("@/shared/utils/globalErrorhandler.utils");
const express = require("express");
const compression = require("compression");
const morgan = require("morgan");
const { env } = require("./shared/config/env.config");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiting
// app.use("/api/", apiLimiter);

// Health check
app.get("/health", (req, res) => {
  ApiResponse.success(res, HTTP_STATUS.OK, "Healthy", { status: "Healthy" });
});

app.use(env.API_VERSION, require("@/shared/routes/index.routes"));

// Advanced configuration
app.use(
  compression({
    level: 6, // Compression level (0-9)
    threshold: 1024, // শুধু 1KB এর বড় response compress করো
    filter: (req, res) => {
      // Specific routes এর জন্য compression on/off
      if (req.path === "/api/stream") {
        return false; // Don't compress streaming data
      }
      return compression.filter(req, res);
    },
  }),
);

// 404 handler
app.use(notFound);
// Global error handler
app.use(globalErrorHandeler);
module.exports = { app };
