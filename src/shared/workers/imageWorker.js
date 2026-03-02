// shared/workers/image.worker.js
require("module-alias/register");

const { Worker } = require("bullmq");
const fs = require("fs/promises");
const path = require("path");

const { IMAGE_QUEUE_NAME } = require("@/shared/queues/image.queue");
const { connection } = require("@/shared/config/redis.config");
const {
  cloudinaryFileUpload,
  deleteCloudinaryFile,
} = require("@/shared/config/cloudinary.config");
const bikeModel = require("@/modules/bike/bike.model");

const { connectDatabase } = require("../config/db.config");

connectDatabase().then(() => {
  const worker = new Worker(
    IMAGE_QUEUE_NAME,
    async (job) => {
      if (job.name === "upload-bike-image") {
        // return handleCreateBikeImage(job);
        handleCreateBikeImage(job);
      }

      // unknown job
      return null;
    },
    { connection, concurrency: 3 },
  );

  worker.on("ready", () => console.log("✅ Image Worker ready"));
  worker.on("active", (job) => console.log("▶️ Job active:", job.id, job.name));
  worker.on("completed", (job) =>
    console.log("✅ Job completed:", job.id, job.name),
  );
  worker.on("failed", (job, err) =>
    console.log("❌ Job failed:", job?.id, err),
  );
  worker.on("error", (err) => console.log("🔥 Worker error:", err));
});

// upload bike image

async function handleCreateBikeImage(job) {
  const { bikeId, images } = job.data;

  try {
    const bike = await bikeModel.findById(bikeId).select("_id");
    if (!bike) throw new Error("Bike not found");

    for (const img of images) {
      const localPath = img.path; // job payload: { path: "uploads/...." }
      const absPath = path.resolve(localPath);

      // 1) push as processing
      await bikeModel.findByIdAndUpdate(bikeId, {
        $push: {
          image: {
            url: "",
            optimized_url: "",
            publicId: "",
            status: "processing",
            localPath,
            tries: job.attemptsMade + 1,
            lastError: "",
          },
        },
      });

      try {
        // 2) upload
        const uploaded = await cloudinaryFileUpload(absPath);

        // 3) update the exact pushed item by matching localPath
        await bikeModel.findByIdAndUpdate(
          bikeId,
          {
            $set: {
              "image.$[elem].url": uploaded?.secure_url || "",
              "image.$[elem].optimized_url":
                uploaded?.optimized_url || uploaded?.secure_url || "",
              "image.$[elem].publicId": uploaded?.public_id || "",
              "image.$[elem].status": "uploaded",
              "image.$[elem].lastError": "",
              "image.$[elem].tries": job.attemptsMade + 1,
              "image.$[elem].localPath": "",
            },
          },
          {
            arrayFilters: [{ "elem.localPath": localPath }],
          },
        );

        // 4) cleanup success
        await fs.unlink(absPath).catch(() => null);
      } catch (err) {
        // update as failed (never reference uploaded here)
        await bikeModel.findByIdAndUpdate(
          bikeId,
          {
            $set: {
              "image.$[elem].status": "failed",
              "image.$[elem].tries": job.attemptsMade + 1,
              "image.$[elem].lastError": err?.message || "Upload failed",
            },
          },
          {
            arrayFilters: [{ "elem.localPath": localPath }],
          },
        );

        // final failure cleanup (optional)
        if (job.attemptsMade >= 2) {
          await fs.unlink(absPath).catch(() => null);
        }

        throw err;
      }
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}
