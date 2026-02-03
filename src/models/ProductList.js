import mongoose from "mongoose";

const productListSchema = new mongoose.Schema(
  {
    listId: {
      type: String,
      required: true,
      unique: true,
      maxlength: 10,
    },

    name: {
      type: String,
      required: true,
      maxlength: 255,
    },

    url: {
      type: String,
      required: true,
      maxlength: 255,
    },

    description: {
      type: String,
      maxlength: 65535,
    },

    images: {
      image: String,
      thumbnail: String,
    },

    productsCount: {
      type: Number,
      required: true,
    },

    // 🔗 Reference products (IMPORTANT)
    products: [
      {
        type: String, // SKU
        ref: "Product",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("ProductList", productListSchema);
