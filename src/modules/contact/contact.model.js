const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { ApiError } = require("@/shared/utils/apiError.utils");
const mongoose = require("mongoose");

// BD phone number regex: 01XXXXXXXXX or +8801XXXXXXXXX
const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

const contactSchema = new mongoose.Schema(
  {
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      validate: {
        validator: (v) => bdPhoneRegex.test(v),
        message: "Contact number must be a valid Bangladeshi number",
      },
    },
    whatsappNumber: {
      type: String,
      required: [true, "WhatsApp number is required"],
      trim: true,
      validate: {
        validator: (v) => bdPhoneRegex.test(v),
        message: "WhatsApp number must be a valid Bangladeshi number",
      },
    },
    imoNumber: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: (v) => v === null || v === "" || bdPhoneRegex.test(v),
        message: "IMO number must be a valid Bangladeshi number",
      },
    },
    bkashNumber: {
      type: String,
      required: [true, "bKash number is required"],
      trim: true,
      validate: {
        validator: (v) => bdPhoneRegex.test(v),
        message: "bKash number must be a valid Bangladeshi number",
      },
    },
    nagodNumber: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: (v) => v === null || v === "" || bdPhoneRegex.test(v),
        message: "Nagad number must be a valid Bangladeshi number",
      },
    },
    rocketNumber: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: (v) => v === null || v === "" || bdPhoneRegex.test(v),
        message: "Rocket number must be a valid Bangladeshi number",
      },
    },
  },
  {
    timestamps: true,
  },
);

// check contact number or whats'a app number already exist or not
contactSchema.pre("save", async function (next) {
  const contact = await this.constructor.findOne({
    contactNumber: this.contactNumber,
    whatsappNumber: this.whatsappNumber,
  });
  if (contact) {
    throw new ApiError(
      "Contact number or WhatsApp number already exist",
      HTTP_STATUS.BAD_REQUEST,
    );
  }
  next();
});
module.exports =
  mongoose.models.Contact || mongoose.model("Contact", contactSchema);
