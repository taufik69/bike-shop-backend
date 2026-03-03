const slugify = require("slugify");
const { HTTP_STATUS } = require("@/shared/config/constant.config");
const { ApiError } = require("@/shared/utils/apiError.utils");
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, index: true },

    image: {
      url: { type: String, default: "" },
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

    description: { type: String, default: "" },

    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },

    seo: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      keywords: [{ type: String }],
      ogImage: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

// slug from name
categorySchema.pre("save", function () {
  if (!this.isModified("name")) return;
  this.slug = slugify(this.name, { lower: true, strict: true });
});

//  duplicate slug check (async middleware, no next)
categorySchema.pre("save", async function () {
  if (!this.isModified("name")) return;

  const duplicate = await this.constructor.findOne({
    slug: this.slug,
    _id: { $ne: this._id }, // update case safe
  });

  if (duplicate) {
    throw new ApiError("Category name already exist", HTTP_STATUS.BAD_REQUEST);
  }
});

// // seo metadata
// categorySchema.pre("save", function () {
//   if (
//     !this.isModified("name") &&
//     !this.isModified("description") &&
//     !this.isModified("image.url")
//   )
//     return;

//   this.seo.metaTitle = this.name;
//   this.seo.metaDescription = this.description;
//   this.seo.ogImage = this.image?.url || "";
// });

module.exports =
  mongoose.models.Category || mongoose.model("Category", categorySchema);
