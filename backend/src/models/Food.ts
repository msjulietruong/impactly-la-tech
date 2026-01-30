import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFood extends Document {
  product_name: string;
  code: string;
  embedding?: string;
  brands?: string;
  categories?: string;
  image_url?: string;
  environmental_score_grade?: string;
  createdAt: Date;
  updatedAt: Date;
}

const foodSchema: Schema<IFood> = new Schema(
  {
    product_name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    embedding: {
      type: String,
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
    },
  },
  {
    timestamps: true,
  },
);

const Food: Model<IFood> = mongoose.model<IFood>("Food", foodSchema);

export default Food;
