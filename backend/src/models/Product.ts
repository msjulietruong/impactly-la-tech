import mongoose, { Schema, Document, Model } from "mongoose";

export interface ProductSummary {
  data: string[];
  metadata: any;
  generatedAt: string;
}

export interface IProduct extends Document {
  code: number;
  brand: string;
  name: string;
  description?: string;
  categories?: string;
  image_url?: string;
  embedding?: number[];
  summary?: ProductSummary;
  environmental_score_grade?: string | boolean;
  createdAt: string;
  updatedAt: string;
}

const productSchema: Schema<IProduct> = new Schema(
  {
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
  },
  { timestamps: true },
);

const Product: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  productSchema,
  "product",
);

export default Product;
