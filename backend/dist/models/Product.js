import mongoose, { Schema } from "mongoose";
const productSchema = new Schema({
    code: {
        type: Number,
        required: true,
        unique: true,
    },
    brand: {
        type: String,
        required: true,
        unique: true,
        alias: "brands",
    },
    name: {
        type: String,
        required: true,
        alias: "product_name",
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
    ingredients: {
        type: [String],
    },
    embedding: {
        type: [Number],
    },
    summary: {
        data: [String],
        metadata: Schema.Types.Mixed,
        generatedAt: String,
    },
    environmental_score_grade: {
        type: String,
        validate: {
            validator: (v) => typeof v === "string" || typeof v === "boolean",
            message: "Value must be string or boolean",
        },
    },
}, { timestamps: true });
const Product = mongoose.model("Product", productSchema, "product");
export default Product;
