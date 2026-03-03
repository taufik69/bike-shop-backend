const joi = require("joi");
const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { ApiError } = require("@/shared/utils/apiError.utils");

// helpers
const objectId = joi
  .string()
  .trim()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    "string.empty": "Id is required.",
    "string.pattern.base": "Invalid ObjectId.",
  });

const orderCreateSchema = joi.object(
  {
    // model: customer { fullName, phone, address }
    customer: joi
      .object({
        fullName: joi.string().trim().required().messages({
          "string.empty": "Customer fullName is required.",
          "any.required": "Customer fullName is required.",
        }),

        phone: joi.string().required().messages({
          "any.required": "Customer phone is required.",
        }),

        address: joi.string().trim().required().messages({
          "string.empty": "Customer address is required.",
          "any.required": "Customer address is required.",
        }),
      })
      .required()
      .messages({ "any.required": "Customer is required." }),

    email: joi.string().trim().email().allow(null, "").default(null).messages({
      "string.email": "Invalid email address.",
    }),

    note: joi.string().trim().allow(null, "").default(null),

    paymentMethod: joi.string().trim().allow(null, "").default(null),

    accountNumber: joi.string().allow(null, "").default(null),

    transactionId: joi.string().trim().allow(null, "").default(null),

    items: joi
      .array()
      .items(
        joi.object({
          bikeId: objectId.required().messages({
            "string.empty": "Item bikeId is required.",
            "any.required": "Item bikeId is required.",
          }),

          qty: joi.number().integer().min(1).required().messages({
            "number.base": "Item qty must be a number.",
            "number.integer": "Item qty must be an integer.",
            "number.min": "Item qty must be at least 1.",
            "any.required": "Item qty is required.",
          }),
        }),
      )
      .min(1)
      .required()
      .messages({
        "array.base": "Items must be an array.",
        "array.min": "At least 1 item is required.",
        "any.required": "Items are required.",
      }),
  },
  { abortEarly: false, allowUnknown: true },
);

exports.validateCreateOrder = async (req, res, next) => {
  try {
    const value = await orderCreateSchema.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true,
    });

    req.validatedData = value;
    next();
  } catch (error) {
    if (error.details) {
      const message = error.details.map((e) => e.message).join(", ");
      return next(
        new ApiError("Validation error: " + message, HTTP_STATUS.BAD_REQUEST),
      );
    }
    return next(
      new ApiError(
        error.message || "Validation failed",
        HTTP_STATUS.BAD_REQUEST,
      ),
    );
  }
};
