const express = require("express");
const _ = express.Router();
const bikeRoutes = require("@/modules/bike/bike.routes");

// bike routes
_.use("/bike", bikeRoutes);

module.exports = _;
