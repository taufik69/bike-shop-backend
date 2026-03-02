const ApiResponse = require("@/shared/utils/apiResponse.utils");
const asyncHandler = require("@/shared/utils/asyncHandeler.utils");
const { HTTP_STATUS } = require("@/shared/config/constant.config");
const bikeService = require("@/modules/bike/bike.service");

class BikeController {
  createBike = asyncHandler(async (req, res) => {
    const data = req.validatedData;
    const bike = await bikeService.createBike(data);
    return ApiResponse.success(
      res,
      HTTP_STATUS.CREATED,
      "Bike created successfully",
      bike,
    );
  });
  // getbike
  getBikes = asyncHandler(async (req, res) => {
    let query = {};
    let sort = {};
    if (req.query?.slug) {
      query.slug = req.query.slug;
    } else if (req.query?.isSale) {
      query.isSale = req.query.isSale === "true";
    } else if (req.query?.isNew) {
      query.isNew = req.query.isNew === "true";
    } else if (req.query?.isTopSelling) {
      query.isTopSelling = req.query.isTopSelling === "true";
    } else if (req.query?.isHotDeal) {
      query.isHotDeal = req.query.isHotDeal === "true";
    } else if (req.query?.isPopular) {
      query.isPopular = req.query.isPopular === "true";
    } else if (req.query?.isFeatured) {
      query.isFeatured = req.query.isFeatured === "true";
    } else {
      query = {};
    }
    // sort query
    if (req.query?.sortBy == "desc") {
      sort.createdAt = sort.createdAt = -1;
    } else if (req.query?.sortBy == "asc") {
      sort.createdAt = sort.createdAt = 1;
    } else {
      sort = {};
    }
    const bikes = await bikeService.getBikes(query, sort);
    return ApiResponse.success(
      res,
      HTTP_STATUS.OK,
      "Bikes fetched successfully",
      bikes,
    );
  });
}

module.exports = new BikeController();
