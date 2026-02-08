import mongoose, { Schema } from "mongoose";
const esgScoreSchema = new Schema({
    brand_id: {
        type: String,
        required: true,
        unique: true,
    },
    risk_flags: {
        type: String,
    },
    has_esg: {
        type: Boolean,
        required: true,
    },
    source: {
        type: String,
    },
    score_environmental: {
        type: Number,
    },
    score_social: {
        type: Number,
    },
    score_governance: {
        type: Number,
    },
    score_final: {
        type: Number,
    },
    version: {
        type: String,
        required: true,
    },
}, { timestamps: true });
esgScoreSchema.index({ brand_id: 1 }, { unique: true });
const EsgScore = mongoose.model("EsgScore", esgScoreSchema);
export default EsgScore;
