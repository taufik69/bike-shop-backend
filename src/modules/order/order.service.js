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
        // 2) fetch products (single query)
        const bikeIds = data.items.map((it) => it.bikeId);

        const bikes = await bikeModel
          .find({ _id: { $in: bikeIds } })
          .lean()
          .session(session);

        const bMap = new Map(bikes.map((p) => [String(p._id), p]));

        // 3) calc totals + validate stock
        let totalQty = 0;
        let subtotal = 0;

        const orderItems = data.items.map((it) => {
          const p = bMap.get(String(it.bikeId));

          if (!p) {
            throw new ApiError(
              "Invalid product in items",
              HTTP_STATUS.BAD_REQUEST,
            );
          }

          const qty = Number(it.qty || 0);
          console.log(p);
          return;
          if (qty <= 0) {
            throw new ApiError("Invalid quantity", HTTP_STATUS.BAD_REQUEST);
          }

          if (Number(p.stock || 0) < qty) {
            throw new ApiError(
              `Insufficient stock for ${p.name}. Available: ${p.stock}, Requested: ${qty}`,
              HTTP_STATUS.BAD_REQUEST,
            );
          }
          let unitPrice = p.price;
          if (p.discountPercentage > 0) {
            unitPrice = p.afterDiscountPrice;
          }

          totalQty += qty;
          subtotal += unitPrice * qty;

          return {
            productId: p._id,
            name: it.name || p.name,
            slug: it.slug,
            image: it.image,
            price: unitPrice,
            qty,
            color: it.color || null,
            size: it.size || null,
          };
        });

        // 4) create order inside transaction
        // create([doc], {session}) is safest with transactions
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
              paymentMethod: data.paymentMethod || null,
              accountNumber: data.accountNumber || null,
              transactionId: data.transactionId || null,
              note: data.note ? String(data.note).trim() : null,
              paymentMethod: data.paymentMethod || "cod",
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

        // 5) reduce stock (atomic + race safe)
        for (const it of orderItems) {
          const r = await bikeModel.updateOne(
            { _id: it.bikeId },
            { $inc: { stock: -it.qty } },
            { session },
          );

          if (r.modifiedCount !== 1) {
            // someone else bought same stock in parallel
            throw new ApiError(
              "Stock update failed (race condition)",
              HTTP_STATUS.CONFLICT,
            );
          }
        }
      });

      // committed successfully
      return createdOrder;
    } catch (err) {
      throw err;
    } finally {
      session.endSession();
    }
  }

  //   get getOrders
  // getOrders = async (query) => {
  //   const orders = await orderModel.find(query).sort({ createdAt: -1 });
  //   if (!orders) {
  //     throw new ApiError("Orders not found", HTTP_STATUS.BAD_REQUEST);
  //   }
  //   return orders;
  // };

  // //   delete deleteOrder
  // deleteOrder = async (id) => {
  //   const order = await orderModel.findOneAndDelete({ invoiceId: id });
  //   if (!order) {
  //     throw new ApiError("Order not found", HTTP_STATUS.BAD_REQUEST);
  //   }
  //   return order;
  // };
}

module.exports = new createOrderService();
