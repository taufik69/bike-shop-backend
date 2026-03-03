const { upload } = require("@/shared/middlewares/upload.middleware");
const bikeController = require("@/modules/bike/bike.controller");
const express = require("express");
const { validateBike } = require("@/modules/bike/bike.validation");

const _ = express.Router();
_.route("/create-bike").post(
  upload.fields([{ name: "image", maxCount: 10 }]),
  validateBike,
  bikeController.createBike,
);
_.route("/get-bikes").get(bikeController.getBikes);
_.route("/delete-bike/:slug").delete(bikeController.deleteBike);

module.exports = _;
