import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBrand extends Document {
    name: string;
    web_url?: string;
    company?: string;
    notes?: string;
}

const brandSchema: Schema<IBrand> = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        web_url: {
            type: String,
        },
        company: {
            type: String,
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

const Brand: Model<IBrand> = mongoose.model("Brand", brandSchema, "brands");

export default Brand;
