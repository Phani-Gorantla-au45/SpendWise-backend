import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      maxlength: 64,
    },

    name: {
      type: String,
      required: true,
      maxlength: 255,
    },

    currency: {
      code: { type: String, required: true, maxlength: 3 },   // INR
      symbol: { type: String, required: true, maxlength: 3 }, // ₹
      numericCode: { type: String, required: true, maxlength: 3 }, // 356
    },

    url: {
      type: String,
      required: true,
      maxlength: 255,
    },

    minPrice: {
      type: Number,
      required: true,
    },

    maxPrice: {
      type: Number,
      required: true,
    },

    images: {
      thumbnail: String,
      mobile: String,
      base: String,
      small: String,
      brandLogo: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
