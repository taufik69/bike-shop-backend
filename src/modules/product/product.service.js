const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { imageQueue } = require("@/shared/queues/image.queue");
const { ApiError } = require("@/shared/utils/apiError.utils");
const productModel = require("@/modules/product/product.model");
const { getCache, setCache, flushdb } = require("@/shared/utils/cache.util");

class ProductService {
  createProduct = async (data) => {
    // create product
    const product = await productModel.create({
      ...data,
      image: [],
    });
    if (!product) {
      throw new ApiError("Product not created", HTTP_STATUS.BAD_REQUEST);
    }

    // now call the queue and upload image on background
    imageQueue.add(
      "upload-product-image",
      {
        productId: product._id,
        images: data.image,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return product;
  };

  getProducts = async (filter, sortFilter) => {
    let query = "";
    for (let key in filter) {
      if (key) {
        query = key;
      } else {
        console.log("nai");
      }
    }
    const cacheKey = `products:v1:${JSON.stringify(query || "")}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }
    const products = await productModel
      .find(filter)
      .populate({
        path: "category",
        select:
          "  -__v -updatedAt -updatedBy  -createdBy -filters -description",
      })
      .select(" -__v ")
      .sort(sortFilter);
    if (!products.length) {
      throw new ApiError("Product not found", HTTP_STATUS.NOT_FOUND);
    }
    //  Save to cache (60 seconds)
    await setCache(cacheKey, products, 60);
    return products;
  };
  updateProductInfo = async (slug, data) => {
    const product = await productModel.findOneAndUpdate(
      { slug },
      { $set: data },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!product) {
      throw new ApiError("Product not found", HTTP_STATUS.NOT_FOUND);
    }
    flushdb();

    return product;
  };
  deletedProductImage = async (slug, imageid = []) => {
    const product = await productModel.findOne({ slug });
    if (!product) {
      throw new ApiError("Product not found", HTTP_STATUS.NOT_FOUND);
    }
    // call the imaage queqe
    imageQueue.add(
      "delete-product-image",
      {
        productId: product._id,
        images: imageid,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    // destroy all cached data
    flushdb();
    return product;
  };
  //   upload product imahge
  uploadProductImage = async (slug, images) => {
    const product = await productModel.findOne({ slug });
    if (!product) {
      throw new ApiError("Product not found", HTTP_STATUS.NOT_FOUND);
    }

    // call the imaage queqe
    imageQueue.add(
      "upload-product-image",
      {
        productId: product._id,
        images: images,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return product;
  };
  deleteProductService = async (slug) => {
    const product = await productModel.findOne({ slug });
    if (!product) {
      throw new ApiError("Product not found", HTTP_STATUS.NOT_FOUND);
    }
    // call the imaage queqe
    imageQueue.add(
      "delete-product",
      {
        productId: product._id,
        images: product.image,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    return product;
  };
}

module.exports = new ProductService();
