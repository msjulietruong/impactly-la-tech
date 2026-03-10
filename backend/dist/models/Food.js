import mongoose, { Schema } from "mongoose";
const foodSchema = new Schema({
    product_name: {
        type: Schema.Types.Mixed,
        validate: {
            validator: (v) => typeof v === "string" || typeof v === "number",
            message: "Value must be string or number",
        },
        required: true,
    },
    code: {
        type: Schema.Types.Mixed,
        validate: {
            validator: (v) => typeof v === "string" || typeof v === "number",
            message: "Value must be string or number",
        },
        required: true,
    },
    embedding: {
        type: [Number],
    },
    brands: {
        type: String,
    },
    categories: {
        type: String,
    },
    image_url: {
        type: String,
    },
    environmental_score_grade: {
        type: String,
        validate: {
            validator: (v) => typeof v === "string" || typeof v === "boolean",
            message: "Value must be string or boolean",
        },
    },
}, {
    timestamps: true,
});
const Food = mongoose.model("Food", foodSchema);
export default Food;
