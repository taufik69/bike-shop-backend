const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { ApiError } = require("@/shared/utils/apiError.utils");
const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },

    brand: { type: String, default: "" }, // Legacy
    sku: { type: String, required: true },
    color: [{ type: String, default: "", required: true }],
    size: [{ type: String, default: "" }],

    shortDescription: { type: String, default: "" },
    description: { type: String, default: "", required: true },

    // Category relation
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // Pricing
    price: { type: Number, default: 0, required: [true, "Price is required"] },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", null],
      default: null,
    },
    discountValue: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 }, // calculated

    // Stock
    stock: { type: Number, default: 0, required: [true, "Stock is required"] },
    inStock: { type: Boolean, default: true },

    // Rating
    rating: {
      type: Number,
      default: 0,
      max: [5, "Rating cannot be more than 5"],
    },
    totalReviews: { type: Number, default: 0 },

    // Badges (NEW, SALE etc)
    isNew: { type: Boolean, default: true },
    isSale: { type: Boolean, default: false },
    isLimited: { type: Boolean, default: false },
    isHot: { type: Boolean, default: false },

    image: [
      {
        url: { type: String, default: "" },
        optimized_url: { type: String, default: "" },
        publicId: { type: String, default: "" },
        status: {
          type: String,
          enum: ["pending", "processing", "uploaded", "failed"],
          default: "pending",
        },
        localPath: { type: String, default: "" },
        tries: { type: Number, default: 0 },
        lastError: { type: String, default: "" },
      },
    ],

    // Status
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isBestSelling: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// make a slug
productSchema.pre("save", function () {
  if (!this.isModified("name")) return;
  this.slug = slugify(this.name, { lower: true, strict: true });
});

// check sku and slug already exist in database before save
productSchema.pre("save", async function () {
  if (!this.isModified("sku")) return;

  const duplicate = await this.constructor.findOne({
    sku: this.sku,
    _id: { $ne: this._id },
  });

  if (duplicate) {
    throw new ApiError("Product SKU already exist", HTTP_STATUS.BAD_REQUEST);
  }
});

// if discount have percentage then calculate final price
productSchema.pre("save", function () {
  if (this.discountType === "percentage") {
    this.finalPrice = Math.round(
      this.price - (this.price * this.discountValue) / 100,
    );
  } else if (this.discountType === "fixed") {
    this.finalPrice = Math.round(this.price - this.discountValue);
  } else {
    this.finalPrice = Math.round(this.price);
  }
});

productSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (!update) return;

  // support both direct update and $set update
  const name = update.name || update.$set?.name;

  if (!name) return;

  const slug = slugify(name, { lower: true, strict: true });

  if (update.$set) {
    update.$set.slug = slug;
  } else {
    update.slug = slug;
  }

  this.setUpdate(update);
});

module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
