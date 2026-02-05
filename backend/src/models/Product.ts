import mongoose, { Schema, Document, Model } from "mongoose";

export interface ProductSummary {
  data: string[];
  metadata: any;
  generatedAt: string;
}

export interface IProduct extends Document {
  code: string;
  brand: string;
  name: string;
  description?: string;
  categories?: string;
  image_url?: string;
  embedding?: number[];
  summary?: ProductSummary;
  createdAt: string;
  updatedAt: string;
}

const productSchema: Schema<IProduct> = new Schema(
  {
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
  },
  { timestamps: true },
);

const Product: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  productSchema,
);

export default Product;
