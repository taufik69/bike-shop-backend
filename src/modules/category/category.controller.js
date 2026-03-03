const { ApiError } = require("@/shared/utils/apiError.utils");
const ApiResponse = require("@/shared/utils/apiResponse.utils");
const asyncHandler = require("@/shared/utils/asyncHandeler.utils");
const categoryService = require("@/modules/category/category.service");
const { HTTP_STATUS } = require("@/shared/config/constant.config");

class CategoryController {
  createCategory = asyncHandler(async (req, res, next) => {
    const category = await categoryService.createCategory(req.validatedData);
    ApiResponse.success(res, HTTP_STATUS.CREATED, "Category created", category);
  });
  getCategory = asyncHandler(async (req, res, next) => {
    let query = {};
    if (req.query.slug) {
      query.slug = req.query.slug;
    } else {
      query = {};
    }
    const category = await categoryService.getCategories(query);

    ApiResponse.success(res, HTTP_STATUS.OK, "Category fetched", category);
  });

  deleteCategory = asyncHandler(async (req, res, next) => {
    if (!req.params.slug) {
      throw new ApiError("Category slug is required", HTTP_STATUS.BAD_REQUEST);
    }

    const category = await categoryService.deleteCategory(req.params.slug);
    ApiResponse.success(res, HTTP_STATUS.OK, "Category deleted", category);
  });
}

module.exports = new CategoryController();
