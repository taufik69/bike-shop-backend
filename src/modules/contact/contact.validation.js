const joi = require("joi");
const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { ApiError } = require("@/shared/utils/apiError.utils");

// BD number: 01XXXXXXXXX or +8801XXXXXXXXX
const bdNumberPattern = /^(?:\+?88)?01[3-9]\d{8}$/;

const bdNumberSchema = joi
  .string()
  .trim()
  .pattern(bdNumberPattern)
  .messages({
    "string.pattern.base":
      "Must be a valid Bangladeshi number (e.g. 01XXXXXXXXX or +8801XXXXXXXXX)",
  });


// CREATE CONTACT VALIDATION

const contactCreateSchema = joi.object(
  {
    contactNumber: bdNumberSchema.required().messages({
      "string.empty": "Contact number is required",
      "any.required": "Contact number is required",
    }),

    whatsappNumber: bdNumberSchema.required().messages({
      "string.empty": "WhatsApp number is required",
      "any.required": "WhatsApp number is required",
    }),

    imoNumber: bdNumberSchema.allow("", null).optional().messages({
      "string.pattern.base":
        "IMO number must be a valid Bangladeshi number",
    }),

    bkashNumber: bdNumberSchema.required().messages({
      "string.empty": "bKash number is required",
      "any.required": "bKash number is required",
    }),

    nagodNumber: bdNumberSchema.allow("", null).optional().messages({
      "string.pattern.base":
        "Nagad number must be a valid Bangladeshi number",
    }),

    rocketNumber: bdNumberSchema.allow("", null).optional().messages({
      "string.pattern.base":
        "Rocket number must be a valid Bangladeshi number",
    }),
  },
  { abortEarly: false },
);

exports.validateContact = async (req, res, next) => {
  try {
    const value = await contactCreateSchema.validateAsync(req.body, {
      abortEarly: false,
    });
    req.validatedData = value;
    next();
  } catch (error) {
    if (error.details) {
      const message = error.details.map((err) => err.message).join(", ");
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


// UPDATE CONTACT VALIDATION

const contactUpdateSchema = joi
  .object(
    {
      contactNumber: bdNumberSchema.optional(),
      whatsappNumber: bdNumberSchema.optional(),
      imoNumber: bdNumberSchema.allow("", null).optional(),
      bkashNumber: bdNumberSchema.optional(),
      nagodNumber: bdNumberSchema.allow("", null).optional(),
      rocketNumber: bdNumberSchema.allow("", null).optional(),
    },
    { abortEarly: false },
  )
  .min(1);

exports.validateUpdateContact = async (req, res, next) => {
  try {
    const value = await contactUpdateSchema.validateAsync(req.body, {
      abortEarly: false,
    });
    req.validatedData = value;
    next();
  } catch (error) {
    if (error.details) {
      const message = error.details.map((err) => err.message).join(", ");
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
