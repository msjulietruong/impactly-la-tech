import mongoose, { Schema } from "mongoose";
const productSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    brand: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    categories: {
        type: String,
    },
    image_url: {
        type: String,
    },
    embedding: {
        type: [Number],
    },
    summary: {
        type: String,
    },
}, { timestamps: true });
const Product = mongoose.model("Product", productSchema);
export default Product;
