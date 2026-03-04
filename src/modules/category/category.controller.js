const { ApiError } = require("@/shared/utils/apiError.utils");
const ApiResponse = require("@/shared/utils/apiResponse.utils");
const asyncHandler = require("@/shared/utils/asyncHandeler.utils");
const categoryService = require("@/modules/category/category.service");
const { HTTP_STATUS } = require("@/shared/config/constant.config");

// cache utils
const {
  getCache,
  setCache,
  buildCacheKey,
  bumpNsVersion,
  deleteCache,
} = require("@/shared/utils/cache.util");

class CategoryController {
  createCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.createCategory(req.validatedData);

    //  revalidate all category caches
    await bumpNsVersion("categories");

    // optional: single cache delete (if you keep detail cache by slug)
    if (category?.slug) {
      await deleteCache(`category:${category.slug}`);
    }

    ApiResponse.success(res, HTTP_STATUS.CREATED, "Category created", category);
  });

  getCategory = asyncHandler(async (req, res) => {
    const query = {};
    const slug = req.query.slug ? String(req.query.slug).trim() : null;

    if (slug) query.slug = slug;

    //  cache key
    const suffix = slug ? `slug=${slug}` : "all";
    const cacheKey = await buildCacheKey("categories", suffix);

    // try cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Category fetched from cache",
        cached,
      );
    }

    //  fetch from DB
    const category = await categoryService.getCategories(query);

    //  set cache
    await setCache(cacheKey, category, 60); // ttl 60s (adjust)

    ApiResponse.success(res, HTTP_STATUS.OK, "Category fetched", category);
  });

  deleteCategory = asyncHandler(async (req, res) => {
    const slug = req.params.slug ? String(req.params.slug).trim() : null;
    if (!slug) {
      throw new ApiError("Category slug is required", HTTP_STATUS.BAD_REQUEST);
    }

    const category = await categoryService.deleteCategory(slug);

    //  revalidate all category caches
    await bumpNsVersion("categories");

    //  optional: single cache delete (if you keep detail cache by slug)
    await deleteCache(`category:${slug}`);

    ApiResponse.success(res, HTTP_STATUS.OK, "Category deleted", category);
  });
}

module.exports = new CategoryController();
