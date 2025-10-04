import mongoose from 'mongoose';

const esgSourceSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true
  },
  asOf: {
    type: String, // ISO string
    required: true
  },
  raw: {
    E: { type: Number, min: 0, max: 100 },
    S: { type: Number, min: 0, max: 100 },
    G: { type: Number, min: 0, max: 100 },
    scale: { type: String, default: "0-100" }
  }
});

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    aliases: [String],
    tickers: [String],
    country: {
        type: String,
        default: null
    },
    domains: [String],
    esgSources: [esgSourceSchema]
}, {
    timestamps: true
}
);

// Indexes
companySchema.index(
    { "tickers": 1 },
    { unique: true, collation: { locale: 'en', strength: 2 } }
);
companySchema.index({ name: 1 });
companySchema.index({ "esgSources.asOf": -1 });

const Company = mongoose.model("Company", companySchema);
export default Company;
