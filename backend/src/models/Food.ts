import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFood extends Document {
  product_name: string | number;
  code: string;
  embedding?: number[];
  brands?: string | number;
  categories?: string;
  image_url?: string;
  environmental_score_grade?: string | boolean;
  createdAt: Date;
  updatedAt: Date;
}

const foodSchema: Schema<IFood> = new Schema(
  {
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
  },
  {
    timestamps: true,
  },
);

const Food: Model<IFood> = mongoose.model<IFood>("Food", foodSchema);

export default Food;
