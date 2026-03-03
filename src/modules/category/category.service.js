const categoryModel = require("@/modules/category/category.model");
const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { imageQueue } = require("@/shared/queues/image.queue");
const { ApiError } = require("@/shared/utils/apiError.utils");
const {
  getCache,
  setCache,
  deleteCache,
} = require("@/shared/utils/cache.util");

class categoryService {
  createCategory = async (data) => {
    const files = data?.image || [];
    const firstImage = Array.isArray(files) ? files[0] : null;

    // 1) Prepare category payload
    const payload = {
      ...data,
      image: {
        status: firstImage ? "pending" : "pending",
        localPath: firstImage?.path || "",
        url: "",
        publicId: "",
        tries: 0,
        lastError: "",
      },
    };

    //  Create category in DB
    const category = await categoryModel.create(payload);
    if (!category) {
      throw new ApiError("Category not created", HTTP_STATUS.BAD_REQUEST);
    }

    //  Enqueue image upload job (BullMQ)
    if (firstImage?.path) {
      const job = await imageQueue.add(
        "upload-category-image",
        {
          categoryId: category._id.toString(),
          localPath: firstImage.path,
        },
        {
          attempts: 3, // retry
          backoff: { type: "exponential", delay: 3000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      return {
        categoryId: category.name,
        jobId: job.id,
        status: "queued",
      };
    }
  };
  getCategories = async (query) => {
    const categories = await categoryModel.find(query);
    if (!categories) {
      throw new ApiError("Categories not found", HTTP_STATUS.NOT_FOUND);
    }

    return categories;
  };

  deleteCategory = async (slug) => {
    const category = await categoryModel.findOneAndDelete({ slug });
    if (!category) {
      throw new ApiError("Category not found", HTTP_STATUS.NOT_FOUND);
    }
    // now remove the old image
    const job = await imageQueue.add(
      "delete-category-image",
      {
        categoryId: category._id.toString(),
        publicId: category.image.publicId,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    const key = JSON.stringify(slug);
    deleteCache(key);

    return {
      categoryId: `${category.name} deleted Sucessfully`,
      jobId: job.id,
      status: "queued",
    };
  };
}

module.exports = new categoryService();
