const express = require("express");
const contactController = require("@/modules/contact/contact.controller");
const {
  validateContact,
  validateUpdateContact,
} = require("@/modules/contact/contact.validation");

const _ = express.Router();

// POST   /api/v1/contact/create
_.route("/create-contact").post(
  validateContact,
  contactController.createContact,
);

// GET    /api/v1/contact/all
_.route("/all").get(contactController.getAllContacts);

// GET    /api/v1/contact/:id
_.route("/:id").get(contactController.getContactById);

// PATCH  /api/v1/contact/update/:id
_.route("/update/:id").patch(
  validateUpdateContact,
  contactController.updateContact,
);

// DELETE /api/v1/contact/delete/:id
_.route("/delete/:id").delete(contactController.deleteContact);

module.exports = _;
