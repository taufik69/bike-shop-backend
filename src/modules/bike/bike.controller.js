const ApiResponse = require("@/shared/utils/apiResponse.utils");
const asyncHandler = require("@/shared/utils/asyncHandeler.utils");
const { HTTP_STATUS } = require("@/shared/config/constant.config");
const bikeService = require("@/modules/bike/bike.service");
const {
  getCache,
  setCache,
  buildCacheKey,
  bumpNsVersion,
  deleteCache,
} = require("@/shared/utils/cache.util");

// Namespace used for all bike caches
const NS = "bikes";

// Stable suffix builder for list caching
const buildBikesSuffix = (q) => {
  const page = Number(q.page || 1);
  const limit = Number(q.limit || 10);
  const slug = q.slug ? String(q.slug).trim() : "";
  const isSale = q.isSale ?? "";
  const isNew = q.isNew ?? "";
  const isTopSelling = q.isTopSelling ?? "";
  const isHotDeal = q.isHotDeal ?? "";
  const isPopular = q.isPopular ?? "";
  const isFeatured = q.isFeatured ?? "";
  const category = q.category ? String(q.category).trim() : "";
  const search = q.search ? String(q.search).trim() : "";
  const minPrice = q.minPrice ?? "";
  const maxPrice = q.maxPrice ?? "";
  const sortBy = q.sortBy ? String(q.sortBy).trim() : "";

  return [
    `page=${page}`,
    `limit=${limit}`,
    `slug=${slug}`,
    `isSale=${isSale}`,
    `isNew=${isNew}`,
    `isTopSelling=${isTopSelling}`,
    `isHotDeal=${isHotDeal}`,
    `isPopular=${isPopular}`,
    `isFeatured=${isFeatured}`,
    `category=${category}`,
    `search=${search}`,
    `minPrice=${minPrice}`,
    `maxPrice=${maxPrice}`,
    `sortBy=${sortBy}`,
  ].join("&");
};

class BikeController {
  // POST /bike/create-bike
  createBike = asyncHandler(async (req, res) => {
    const data = req.validatedData;
    const bike = await bikeService.createBike(data);

    // Invalidate all bikes list caches
    await bumpNsVersion(NS);

    return ApiResponse.success(
      res,
      HTTP_STATUS.CREATED,
      "Bike created successfully",
      bike,
    );
  });

  // GET /bike/get-bikes
  getBikes = asyncHandler(async (req, res) => {
    let query = {};
    let sort = {};

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filters
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
    } else if (req.query?.category) {
      query.category = req.query.category;
    } else if (req.query?.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    } else if (req.query?.minPrice && req.query?.maxPrice) {
      query.price = {
        $gte: parseFloat(req.query.minPrice),
        $lte: parseFloat(req.query.maxPrice),
      };
    }

    // Sort
    if (req.query?.sortBy === "desc") {
      sort.createdAt = -1;
    } else if (req.query?.sortBy === "asc") {
      sort.createdAt = 1;
    }

    // Cache key generation
    const suffix = buildBikesSuffix(req.query);
    const cacheKey = await buildCacheKey(NS, suffix);

    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Bikes fetched successfully (cache)",
        cached,
      );
    }

    // DB fetch
    const bikes = await bikeService.getBikes(query, sort, limit, skip);

    // Store in cache for 60 seconds
    await setCache(cacheKey, bikes, 60);

    return ApiResponse.success(
      res,
      HTTP_STATUS.OK,
      "Bikes fetched successfully",
      bikes,
    );
  });

  // DELETE /bike/delete-bike/:slug
  deleteBike = asyncHandler(async (req, res) => {
    const slug = req.params.slug ? String(req.params.slug).trim() : null;
    const bikeName = await bikeService.deleteBike(slug);

    // Invalidate list caches + specific item cache if maintained
    await bumpNsVersion(NS);
    await deleteCache(`bike:${slug}`);

    return ApiResponse.success(
      res,
      HTTP_STATUS.OK,
      "Bike deleted successfully",
      bikeName,
    );
  });
}

module.exports = new BikeController();
