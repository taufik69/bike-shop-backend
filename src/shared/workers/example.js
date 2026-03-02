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

const categoryModel = require("@/modules/categories/categories.model");
const { connectDatabase } = require("../config/db.config");

connectDatabase().then(() => {
  const worker = new Worker(
    IMAGE_QUEUE_NAME,
    async (job) => {
      if (job.name === "upload-category-image") {
        return handleCreateCategoryImage(job);
      }

      if (job.name === "update-category-image") {
        return handleUpdateCategoryImage(job);
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

/** ----- Create Category Image ----- */
async function handleCreateCategoryImage(job) {
  const { categoryId, localPath } = job.data;
  const absPath = path.resolve(localPath);

  await categoryModel.findByIdAndUpdate(categoryId, {
    "image.status": "processing",
    "image.localPath": localPath,
    "image.tries": job.attemptsMade,
  });

  try {
    const uploaded = await cloudinaryFileUpload(absPath);

    await categoryModel.findByIdAndUpdate(categoryId, {
      "image.url": uploaded.secure_url,
      "image.publicId": uploaded.public_id,
      "image.status": "uploaded",
      "image.lastError": "",
      "image.tries": job.attemptsMade + 1,
      "seo.ogImage": uploaded.secure_url,
    });

    await fs.unlink(absPath).catch(() => null);
    return { categoryId, imageUrl: uploaded.secure_url };
  } catch (err) {
    await categoryModel.findByIdAndUpdate(categoryId, {
      "image.status": "failed",
      "image.tries": job.attemptsMade + 1,
      "image.lastError": err?.message || "Upload failed",
      "image.localPath": localPath,
    });

    throw err;
  } finally {
    if (job.attemptsMade >= 2) {
      await fs.unlink(absPath).catch(() => null);
    }
  }
}

/** ----- Update Category Image (upload new + delete old) ----- */
async function handleUpdateCategoryImage(job) {
  const { categoryId, localPath, oldPublicId } = job.data;
  const absPath = path.resolve(localPath);

  // processing
  await categoryModel.findByIdAndUpdate(categoryId, {
    "image.status": "processing",
    "image.localPath": localPath,
    "image.tries": job.attemptsMade,
  });

  try {
    // upload new
    const uploaded = await cloudinaryFileUpload(absPath);

    //  prevent race: only update if still same localPath
    const updated = await categoryModel.findOneAndUpdate(
      { _id: categoryId, "image.localPath": localPath },
      {
        $set: {
          "image.url": uploaded.secure_url,
          "image.publicId": uploaded.public_id,
          "image.status": "uploaded",
          "image.lastError": "",
          "image.tries": job.attemptsMade + 1,
          "seo.ogImage": uploaded.secure_url,
        },
      },
      { new: true },
    );

    // if newer update came, skip delete
    if (!updated) {
      await fs.unlink(absPath).catch(() => null);
      return { categoryId, skipped: true };
    }

    // delete old after success
    if (oldPublicId && oldPublicId !== uploaded.public_id) {
      await deleteCloudinaryFile(oldPublicId);
    }

    await fs.unlink(absPath).catch(() => null);
    return { categoryId, imageUrl: uploaded.secure_url };
  } catch (err) {
    await categoryModel.findByIdAndUpdate(categoryId, {
      "image.status": "failed",
      "image.tries": job.attemptsMade + 1,
      "image.lastError": err?.message || "Upload failed",
      "image.localPath": localPath,
    });

    throw err;
  } finally {
    if (job.attemptsMade >= 2) {
      await fs.unlink(absPath).catch(() => null);
    }
  }
}
