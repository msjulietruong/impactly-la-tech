import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEsgScore extends Document {
  brand_id: string;
  risk_flags?: string;
  has_esg: boolean;
  source?: string;

  score_environmental?: number;
  score_social?: number;
  score_governance?: number;
  score_final?: number;

  version?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const esgScoreSchema: Schema<IEsgScore> = new Schema(
  {
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
  },
  { timestamps: true },
);

esgScoreSchema.index({ brand_id: 1 }, { unique: true });

const EsgScore: Model<IEsgScore> = mongoose.model<IEsgScore>(
  "EsgScore",
  esgScoreSchema,
);

export default EsgScore;
