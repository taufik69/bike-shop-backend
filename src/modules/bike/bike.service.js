const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { imageQueue } = require("@/shared/queues/image.queue");
const { ApiError } = require("@/shared/utils/apiError.utils");
const bikeModel = require("@/modules/bike/bike.model");
const { getCache, setCache, flushdb } = require("@/shared/utils/cache.util");

class bikeService {
  createBike = async (data) => {
    const bike = await bikeModel.create({
      ...data,
      image: [],
    });
    if (!bike) {
      throw new ApiError("Bike not created", HTTP_STATUS.BAD_REQUEST);
    }
    // now call the queue and upload image on background
    imageQueue.add(
      "upload-bike-image",
      {
        bikeId: bike._id,
        images: data.image,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    return bike;
  };
  getBikes = async (query, sortQuery, limit, skip) => {
    // const cacheKey = `bikes:${JSON.stringify(query)}`;
    // const cachedData = await getCache(cacheKey);
    // if (cachedData) {
    //   return JSON.parse(cachedData);
    // }
    const bikes = await bikeModel
      .find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();
    // await setCache(cacheKey, JSON.stringify(bikes), "EX", 60 * 60); // cache for 1 hour
    return bikes;
  };

  // delete bike
  deleteBike = async (slug) => {
    const bike = await bikeModel.findOne({ slug });
    if (!bike) {
      throw new ApiError("Bike not found", HTTP_STATUS.NOT_FOUND);
    }
    // now call the queue and delete image on background
    imageQueue.add(
      "delete-bike-image",
      {
        bikeId: bike._id,
        images: bike.image,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    // flush cache
    // await flushdb();
    return bike.name;
  };
}

module.exports = new bikeService();
