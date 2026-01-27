import mongoose from "mongoose";

const esgScoreSchema = new mongoose.Schema({
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
    type: Integer,
  },
  score_social: {
    type: Integer,
  },
  score_governance: {
    type: Integer,
  },
  score_final: {
    type: Integer,
  },
  version: {
    type: String,
    required: true,
  },
  timestamp: true,
});

const EsgScore = mongoose.model("EsgScore", esgScoreSchema);

export default EsgScore;
