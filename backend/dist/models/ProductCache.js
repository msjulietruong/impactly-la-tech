import mongoose, { Schema } from "mongoose";
const productCacheSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        index: true,
        description: "Product identifier (barcode, UPC, EAN, GTIN, or search query)",
        trim: true,
    },
    data: {
        type: Schema.Types.Mixed,
        required: true,
        description: "Cached product data in normalized format",
    },
}, {
    timestamps: true,
});
productCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });
const ProductCache = mongoose.model("ProductCache", productCacheSchema);
export default ProductCache;
