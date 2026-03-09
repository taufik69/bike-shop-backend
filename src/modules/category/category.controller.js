const ApiResponse = require("@/shared/utils/apiResponse.utils");
const asyncHandler = require("@/shared/utils/asyncHandeler.utils");
const { HTTP_STATUS } = require("@/shared/config/constant.config");
const categoryService = require("@/modules/category/category.service");
const {
  getCache,
  setCache,
  buildCacheKey,
  bumpNsVersion,
  deleteCache,
} = require("@/shared/utils/cache.util");

// Namespace used for all category caches
const NS = "categories";

class CategoryController {
  // POST /category/create-category
  createCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.createCategory(req.validatedData);

    // Invalidate all category list caches
    await bumpNsVersion(NS);

    return ApiResponse.success(
      res,
      HTTP_STATUS.CREATED,
      "Category created successfully",
      category,
    );
  });

  // GET /category/get-category
  getCategory = asyncHandler(async (req, res) => {
    let query = {};
    const slug = req.query.slug ? String(req.query.slug).trim() : "";

    if (slug) {
      query.slug = slug;
    }

    // Build a stable cache key based on the query (slug or all)
    const suffix = slug ? `slug=${slug}` : "all";
    const cacheKey = await buildCacheKey(NS, suffix);

    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Categories fetched successfully (cache)",
        cached,
      );
    }

    // DB fetch
    const categories = await categoryService.getCategories(query);

    // Store in cache for 60 seconds
    await setCache(cacheKey, categories, 60);

    return ApiResponse.success(
      res,
      HTTP_STATUS.OK,
      "Categories fetched successfully",
      categories,
    );
  });

  // DELETE /category/delete-category/:slug
  deleteCategory = asyncHandler(async (req, res) => {
    const slug = req.params.slug ? String(req.params.slug).trim() : null;
    const category = await categoryService.deleteCategory(slug);

    // Invalidate list caches + specific slug cache if it exists
    await bumpNsVersion(NS);
    await deleteCache(`category:${slug}`);

    return ApiResponse.success(
      res,
      HTTP_STATUS.OK,
      "Category deleted successfully",
      category,
    );
  });
}

module.exports = new CategoryController();
