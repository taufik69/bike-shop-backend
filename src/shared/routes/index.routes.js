const express = require("express");
const _ = express.Router();
const bikeRoutes = require("@/modules/bike/bike.routes");
const categoryRoutes = require("@/modules/category/category.routes");
const orderRoute = require("@/modules/order/order.route");

// category routes
_.use("/category", categoryRoutes);
// bike routes
_.use("/bike", bikeRoutes);
_.use("/order", orderRoute);

module.exports = _;
