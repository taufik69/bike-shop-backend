const express = require("express");
const _ = express.Router();
const { upload } = require("@/shared/middlewares/upload.middleware");
const categoryController = require("@/modules/category/category.controller");
const { validateCategory } = require("@/modules/category/category.validation");

_.route("/create-category").post(
  upload.fields([{ name: "image", maxCount: 1 }]),
  validateCategory,
  categoryController.createCategory,
);

_.route("/get-category").get(categoryController.getCategory);
_.route("/delete-category/:slug").delete(categoryController.deleteCategory);
module.exports = _;
