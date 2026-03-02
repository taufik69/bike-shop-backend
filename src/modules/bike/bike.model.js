const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { ApiError } = require("@/shared/utils/apiError.utils");
const mongoose = require("mongoose");
const slugify = require("slugify");

const bikeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Bike name is required"],
  },
  bikeName: {
    type: String,
    required: [true, "Bike name is required"],
  },
  model: {
    type: String,
    required: [true, "Bike model is required"],
  },
  downPayment: {
    type: Number,
    required: [true, "Bike down payment is required"],
  },
  cashBackOffer: {
    type: Number,
    required: [true, "Bike cash back offer is required"],
  },
  emi_per_month: {
    type: Number,
    required: [true, "Bike emi per month is required"],
  },
  emi_duration: {
    type: String,
    required: [true, "Bike emi duration is required"],
  },
  interest_Rate: {
    type: String,
    required: [true, "Bike interest rate is required"],
  },
  additonal_Message: [
    {
      type: String,
      default: null,
    },
  ],
  booking_number: {
    type: String,
    required: [true, "Bike booking number is required"],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Bike category is required"],
  },
  tag: [
    {
      type: String,
      default: null,
    },
  ],
  slug: {
    type: String,
    trim: true,
    unique: true,
  },
  price: {
    type: Number,
    required: [true, "Bike price is required"],
  },
  description: {
    type: String,
    required: [true, "Bike description is required"],
  },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isSale: {
    type: Boolean,
    default: false,
  },
  isNew: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isTopSelling: {
    type: Boolean,
    default: false,
  },
  isHotDeal: {
    type: Boolean,
    default: false,
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  discountPercentage: {
    type: Number,
    default: 0,
  },
  afterDiscountPrice: {
    type: Number,
    default: 0,
  },
  stock: {
    type: Number,
    default: 0,
    required: [true, "Bike stock is required"],
  },
});

bikeSchema.pre("save", function () {
  if (this.isModified("name") || this.isNew) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  return;
});

// check slug is exist or not
bikeSchema.pre("save", async function () {
  if (!this.isModified("name")) return;
  const existingBike = await this.constructor.findOne({ slug: this.slug });
  if (existingBike && existingBike._id.toString() !== this._id.toString()) {
    throw new ApiError("Slug already exists", HTTP_STATUS.BAD_REQUEST);
  }
});

// calculate discount price if discount percentage is greater than 0
bikeSchema.pre("save", function () {
  if (this.discountPercentage > 0) {
    this.afterDiscountPrice =
      this.price - (this.price * this.discountPercentage) / 100;
  }
});
// Index for text search on name and description
bikeSchema.index({ name: "text", description: "text", slug: "text" });

module.exports = mongoose.models.Bike || mongoose.model("Bike", bikeSchema);
