const { ApiError } = require("@/shared/utils/apiError.utils");
const ApiResponse = require("@/shared/utils/apiResponse.utils");
const asyncHandler = require("@/shared/utils/asyncHandeler.utils");
const orderService = require("@/modules/order/order.service");
const { HTTP_STATUS } = require("@/shared/config/constant.config");

class orderController {
  createOrder = asyncHandler(async (req, res) => {
    const order = await orderService.createOrder(req.validatedData);
    ApiResponse.success(res, HTTP_STATUS.CREATED, "Order created", order);
  });
  getOrders = asyncHandler(async (req, res) => {
    let query = {};
    if (req.query.invoiceId) {
      query.invoiceId = req.query.invoiceId;
    } else {
      query = {};
    }
    const orders = await orderService.getOrders(query);
    ApiResponse.success(res, HTTP_STATUS.OK, "Orders fetched", orders);
  });
  deleteOrder = asyncHandler(async (req, res) => {
    const order = await orderService.deleteOrder(req.params.invoiceId);
    ApiResponse.success(res, HTTP_STATUS.OK, "Order deleted", order);
  });
}

module.exports = new orderController();
