const joi = require("joi");
const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { ApiError } = require("@/shared/utils/apiError.utils");
const { validateImageFiles } = require("@/shared/helpers/imageValidation");

const productSchema = joi.object(
  {
    name: joi.string().trim().required().messages({
      "string.empty": "Product name is required",
    }),

    description: joi.string().trim().required().messages({
      "string.empty": "Description is required",
    }),
    sku: joi.string().trim().required().messages({
      "string.empty": "SKU is required",
    }),

    category: joi.string().required().messages({
      "string.empty": "Category is required",
    }),

    price: joi.number().required().messages({
      "any.required": "Price is required",
    }),
    discountType: joi
      .string()
      .valid("percentage", "fixed", null)
      .default(null)
      .optional()
      .messages({
        "any.required": "Discount type is required",
      }),
    discountValue: joi.number().default(0).optional().messages({
      "any.required": "Discount value is required",
    }),

    stock: joi.number().required().messages({
      "any.required": "Stock is required",
    }),

    color: joi.array().items(joi.string().trim()).min(1).required().messages({
      "array.min": "At least one color is required",
    }),
  },
  {
    abortEarly: false,
    allowUnknown: true,
  },
);

exports.validateProduct = async (req, res, next) => {
  try {
    const value = await productSchema.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true,
    });

    // Image validation (max 10)
    const images = validateImageFiles({
      req,
      next,
      required: true,
      maxCount: 10,
      maxSizeMB: 10,
      fieldName: "image",
    });

    req.validatedData = {
      ...value,
      image: images,
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

// product update
const updateSchema = joi
  .object(
    {
      name: joi.string().trim().optional(),
      price: joi.number().optional(),
      stock: joi.number().optional(),
      description: joi.string().allow("").optional(),
      color: joi.array().items(joi.string().trim()).optional(),
      size: joi.array().items(joi.string().trim()).optional(),
    },
    { abortEarly: false, allowUnknown: true },
  )
  .min(1);

exports.validateUpdateProduct = async (req, res, next) => {
  try {
    const value = await updateSchema.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true,
    });

    // image optional but max 10
    const images = validateImageFiles({
      req,
      next,
      required: req?.files?.image?.length > 0 ? true : false,
      maxCount: 10,
      maxSizeMB: 10,
      fieldName: "image",
    });

    req.validatedData = {
      ...value,
      image: images,
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

// only image vfalidation
exports.validateProductImage = async (req, res, next) => {
  try {
    const images = validateImageFiles({
      req,
      next,
      required: true,
      maxCount: 10,
      maxSizeMB: 10,
      fieldName: "image",
    });

    req.validatedData = {
      image: images,
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
