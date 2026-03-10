import mongoose, { Schema, Document, Model } from "mongoose";
import { IProduct } from "../models/Product.js";

export type ProductData = Record<string, unknown>;

export interface IProductCache extends Document {
    code: string;
    data: any;
    createdAt: Date;
    updatedAt: Date;
}

const productCacheSchema: Schema<IProductCache> = new Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            index: true,
            description:
                "Product identifier (barcode, UPC, EAN, GTIN, or search query)",
            trim: true,
        },
        data: {
            type: Schema.Types.Mixed,
            required: true,
            description: "Cached product data in normalized format",
        },
    },
    {
        timestamps: true,
    },
);

productCacheSchema.index(
    { updatedAt: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 7 },
);

const ProductCache: Model<IProductCache> = mongoose.model<IProductCache>(
    "ProductCache",
    productCacheSchema,
);

export default ProductCache;
