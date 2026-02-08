import mongoose, { Schema } from "mongoose";
const brandSchema = new Schema({
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
}, {
    timestamps: true,
});
const Brand = mongoose.model("Brand", brandSchema);
export default Brand;
