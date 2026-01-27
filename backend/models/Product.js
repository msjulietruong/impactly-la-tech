import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  brand_id: {
    type: String,
    required: true,
    unique: true,
  },
  product_name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
  },
  image_url: {
    type: String,
  },
  timestamps: true,
});

const Product = mongoose.model("Product", productSchema);

export default Product;
