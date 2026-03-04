const orderModel = require("@/modules/order/order.model");
const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { ApiError } = require("@/shared/utils/apiError.utils");
const bikeModel = require("@/modules/bike/bike.model");
const mongoose = require("mongoose");
class createOrderService {
  async createOrder(data) {
    const session = await mongoose.startSession();

    try {
      let createdOrder = null;

      await session.withTransaction(async () => {
        // 1) collect bikeIds
        const bikeIds = data.items.map((it) => it.bikeId);

        // 2) fetch bikes (single query)
        const bikes = await bikeModel
          .find({ _id: { $in: bikeIds } })
          .select("_id name price stock discountPercentage afterDiscountPrice") // keep small
          .lean()
          .session(session);

        const bMap = new Map(bikes.map((b) => [String(b._id), b]));

        // 3) build order items + validate stock + totals
        let totalQty = 0;
        let subtotal = 0;

        const orderItems = data.items.map((it) => {
          const bike = bMap.get(String(it.bikeId));

          if (!bike) {
            throw new ApiError(
              "Invalid bikeId in items",
              HTTP_STATUS.BAD_REQUEST,
            );
          }

          const qty = Number(it.qty || 0);
          if (!Number.isFinite(qty) || qty <= 0) {
            throw new ApiError("Invalid quantity", HTTP_STATUS.BAD_REQUEST);
          }

          const stock = Number(bike.stock || 0);
          if (stock < qty) {
            throw new ApiError(
              `Insufficient stock for ${bike.name}. Available: ${stock}, Requested: ${qty}`,
              HTTP_STATUS.BAD_REQUEST,
            );
          }

          const unitPrice =
            Number(bike.discountPercentage || 0) > 0
              ? Number(bike.afterDiscountPrice || bike.price)
              : Number(bike.price);

          totalQty += qty;
          subtotal += unitPrice * qty;

          // order model অনুযায়ী
          return {
            bikeId: bike._id,
            qty,
          };
        });

        // 4) create order
        const docs = await orderModel.create(
          [
            {
              customer: {
                fullName: String(data.customer.fullName).trim(),
                phone: String(data.customer.phone).trim(),
                address: String(data.customer.address).trim(),
              },
              email: data.email ? String(data.email).trim() : null,
              note: data.note ? String(data.note).trim() : null,
              paymentMethod: data.paymentMethod
                ? String(data.paymentMethod).trim()
                : null,
              accountNumber: data.accountNumber
                ? String(data.accountNumber).trim()
                : null,
              transactionId: data.transactionId
                ? String(data.transactionId).trim()
                : null,

              items: orderItems,
              totalQty,
              subtotal,
            },
          ],
          { session },
        );

        createdOrder = docs?.[0];
        if (!createdOrder) {
          throw new ApiError("Order not created", HTTP_STATUS.BAD_REQUEST);
        }

        // 5) reduce stock (race-safe)
        // ensure stock is still enough at update time
        for (const it of orderItems) {
          const r = await bikeModel.updateOne(
            { _id: it.bikeId, stock: { $gte: it.qty } },
            { $inc: { stock: -it.qty } },
            { session },
          );

          if (r.modifiedCount !== 1) {
            throw new ApiError(
              "Stock update failed (race condition / out of stock)",
              HTTP_STATUS.CONFLICT,
            );
          }
        }
      });

      return createdOrder;
    } finally {
      await session.endSession();
    }
  }

  //   get getOrders
  getOrders = async (query = {}) => {
    const orders = await orderModel
      .find(query)
      .populate("items.bikeId")
      .sort({ createdAt: -1 });

    if (!orders.length) {
      throw new ApiError("Orders not found", HTTP_STATUS.NOT_FOUND);
    }

    return orders;
  };

  //delete deleteOrder
  deleteOrder = async (id) => {
    const order = await orderModel.findOneAndDelete({ invoiceId: id });
    if (!order) {
      throw new ApiError("Order not found", HTTP_STATUS.BAD_REQUEST);
    }
    return order;
  };
}

module.exports = new createOrderService();
