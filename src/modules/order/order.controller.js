const { ApiError } = require("@/shared/utils/apiError.utils");
const ApiResponse = require("@/shared/utils/apiResponse.utils");
const asyncHandler = require("@/shared/utils/asyncHandeler.utils");
const orderService = require("@/modules/order/order.service");
const { HTTP_STATUS } = require("@/shared/config/constant.config");

const {
  buildCacheKey,
  getCache,
  setCache,
  bumpNsVersion,
  deleteCache,
} = require("@/shared/utils/cache.util");
class orderController {
  createOrder = asyncHandler(async (req, res) => {
    const order = await orderService.createOrder(req.validatedData);
    await bumpNsVersion("orders");
    ApiResponse.success(res, HTTP_STATUS.CREATED, "Order created", order);
  });
  getOrders = asyncHandler(async (req, res) => {
    const { invoiceId } = req.query;

    const query = {};
    if (invoiceId) query.invoiceId = String(invoiceId).trim();

    // cache key suffix (stable)
    const suffix = invoiceId ? `invoiceId=${query.invoiceId}` : "all";
    const cacheKey = await buildCacheKey("orders", suffix);

    const cached = await getCache(cacheKey);
    if (cached) {
      return ApiResponse.success(
        res,
        HTTP_STATUS.OK,
        "Orders fetched from cache",
        cached,
      );
    }

    const orders = await orderService.getOrders(query);

    await setCache(cacheKey, orders, 60);
    ApiResponse.success(res, HTTP_STATUS.OK, "Orders fetched", orders);
  });
  deleteOrder = asyncHandler(async (req, res) => {
    const order = await orderService.deleteOrder(req.params.invoiceId);
    await bumpNsVersion("orders"); // all order-list caches invalid
    // যদি single order cache রাখো:
    // await deleteCache(`order:${req.params.invoiceId}`);
    ApiResponse.success(res, HTTP_STATUS.OK, "Order deleted", order);
  });
}

module.exports = new orderController();
