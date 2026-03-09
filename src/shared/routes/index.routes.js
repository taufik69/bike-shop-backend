const express = require("express");
const _ = express.Router();
const bikeRoutes = require("@/modules/bike/bike.routes");
const categoryRoutes = require("@/modules/category/category.routes");
const orderRoute = require("@/modules/order/order.route");
const contactRoutes = require("@/modules/contact/contact.routes");

// category routes
_.use("/category", categoryRoutes);
// bike routes
_.use("/bike", bikeRoutes);
_.use("/order", orderRoute);
// contact routes
_.use("/contact", contactRoutes);

module.exports = _;
