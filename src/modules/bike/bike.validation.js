const joi = require("joi");
const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { ApiError } = require("@/shared/utils/apiError.utils");
const { validateImageFiles } = require("@/shared/helpers/imageValidation");

// =====================
// CREATE BIKE VALIDATION
// =====================
const bikeCreateSchema = joi.object(
  {
    name: joi.string().trim().required().messages({
      "string.empty": "Bike name is required",
      "any.required": "Bike name is required",
    }),

    bikeName: joi.string().trim().required().messages({
      "string.empty": "Bike bikeName is required",
      "any.required": "Bike bikeName is required",
    }),

    model: joi.string().trim().required().messages({
      "string.empty": "Bike model is required",
      "any.required": "Bike model is required",
    }),

    downPayment: joi.number().required().messages({
      "number.base": "Bike down payment must be a number",
      "any.required": "Bike down payment is required",
    }),

    cashBackOffer: joi.number().required().messages({
      "number.base": "Bike cash back offer must be a number",
      "any.required": "Bike cash back offer is required",
    }),

    emi_per_month: joi.number().required().messages({
      "number.base": "Bike emi per month must be a number",
      "any.required": "Bike emi per month is required",
    }),

    emi_duration: joi.string().trim().required().messages({
      "string.empty": "Bike emi duration is required",
      "any.required": "Bike emi duration is required",
    }),

    interest_Rate: joi.string().trim().required().messages({
      "string.empty": "Bike interest rate is required",
      "any.required": "Bike interest rate is required",
    }),

    additonal_Message: joi
      .array()
      .items(joi.string().trim().allow("").optional())
      .default([])
      .messages({
        "array.base": "Bike additional message must be an array of strings",
      }),

    // 01712345678 or +8801712345678 checke pattern

    booking_number: joi
      .string()
      .trim()
      .required()
      .pattern(/^(?:\+?88)?01[3-9]\d{8}$/)
      .messages({
        "string.empty": "Bike booking number is required",
        "any.required": "Bike booking number is required",
      }),

    category: joi.string().trim().required().messages({
      "string.empty": "Bike category is required",
      "any.required": "Bike category is required",
    }),

    tag: joi
      .array()
      .items(joi.string().trim().allow("").optional())
      .default([])
      .messages({
        "array.base": "Bike tag must be an array of strings",
      }),

    price: joi.number().required().messages({
      "number.base": "Bike price must be a number",
      "any.required": "Bike price is required",
    }),

    description: joi.string().trim().required().messages({
      "string.empty": "Bike description is required",
      "any.required": "Bike description is required",
    }),
    discountPercentage: joi.number().min(0).max(100).default(0).messages({
      "number.base": "Bike discount percentage must be a number",
      "number.min": "Bike discount percentage cannot be less than 0",
      "number.max": "Bike discount percentage cannot be greater than 100",
    }),
    isNew: joi.boolean().default(false),
    isTopSelling: joi.boolean().default(false),
    isHotDeal: joi.boolean().default(false),
    isPopular: joi.boolean().default(false),
    isFeatured: joi.boolean().default(false),
    stock: joi.number().min(0).required().default(0).messages({
      "number.base": "Bike stock must be a number",
      "number.min": "Bike stock cannot be less than 0",
    }),
  },
  {
    abortEarly: false,
    allowUnknown: true,
  },
);

exports.validateBike = async (req, res, next) => {
  try {
    const value = await bikeCreateSchema.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true,
    });

    // Single image (schema: image: String)
    const images = validateImageFiles({
      req,
      next,
      required: true,
      maxCount: 10,
      maxSizeMB: 10,
      fieldName: "image",
    });

    // validateImageFiles  array return করে, single  first item
    const image = Array.isArray(images) ? images : images[0];

    req.validatedData = {
      ...value,
      image,
    };

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

// UPDATE BIKE VALIDATION

const bikeUpdateSchema = joi
  .object(
    {
      name: joi.string().trim().optional(),
      bikeName: joi.string().trim().optional(),
      model: joi.string().trim().optional(),

      downPayment: joi.number().optional(),
      cashBackOffer: joi.number().optional(),
      emi_per_month: joi.number().optional(),

      emi_duration: joi.string().trim().optional(),
      interest_Rate: joi.string().trim().optional(),

      additonal_Message: joi
        .array()
        .items(joi.string().trim().allow("").optional())
        .optional(),

      booking_number: joi.string().trim().optional(),
      category: joi.string().trim().optional(),

      tag: joi
        .array()
        .items(joi.string().trim().allow("").optional())
        .optional(),

      price: joi.number().optional(),
      description: joi.string().trim().allow("").optional(),
    },
    { abortEarly: false, allowUnknown: true },
  )
  .min(1);

exports.validateUpdateBike = async (req, res, next) => {
  try {
    const value = await bikeUpdateSchema.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true,
    });

    // image optional
    const hasImage = req?.files?.image?.length > 0;
    let image;

    if (hasImage) {
      const images = validateImageFiles({
        req,
        next,
        required: true,
        maxCount: 1,
        maxSizeMB: 10,
        fieldName: "image",
      });
      image = Array.isArray(images) ? images[0] : images;
    }

    req.validatedData = {
      ...value,
      ...(hasImage ? { image } : {}),
    };

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
