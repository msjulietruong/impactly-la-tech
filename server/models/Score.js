const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  categories: {
    environmental: {
      score: { type: Number, min: 0, max: 100 },
      details: String
    },
    social: {
      score: { type: Number, min: 0, max: 100 },
      details: String
    },
    governance: {
      score: { type: Number, min: 0, max: 100 },
      details: String
    },
    labor: {
      score: { type: Number, min: 0, max: 100 },
      details: String
    }
  },
  methodology: {
    version: String,
    lastUpdated: Date,
    sources: [String]
  },
  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
scoreSchema.index({ companyId: 1, lastCalculated: -1 });

module.exports = mongoose.model('Score', scoreSchema);
