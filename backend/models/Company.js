import mongoose from 'mongoose';

// ESG score data structure
const esgSourceSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    description: 'Data source identifier (e.g., kaggle-public-company-esg)'
  },
  asOf: {
    type: String, // ISO date string
    required: true,
    description: 'Date when ESG data was collected'
  },
  raw: {
    E: { 
      type: Number, 
      min: 0, 
      max: 100,
      description: 'Environmental score (0-100)'
    },
    S: { 
      type: Number, 
      min: 0, 
      max: 100,
      description: 'Social/Labor score (0-100)'
    },
    G: { 
      type: Number, 
      min: 0, 
      max: 100,
      description: 'Governance score (0-100)'
    },
    scale: { 
      type: String, 
      default: "0-100",
      description: 'Score scale description'
    }
  }
});

// Main company schema
const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    description: 'Official company name'
  },
  aliases: {
    type: [String],
    description: 'Alternative company names'
  },
  tickers: {
    type: [String],
    description: 'Stock ticker symbols (e.g., MSFT, AAPL)'
  },
  country: {
    type: String,
    default: null,
    description: 'Country where company is headquartered'
  },
  domains: {
    type: [String],
    description: 'Company website domains'
  },
  esgSources: {
    type: [esgSourceSchema],
    description: 'ESG data from various sources'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Database indexes for better performance
companySchema.index(
  { "tickers": 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);
companySchema.index({ name: 1 });
companySchema.index({ "esgSources.asOf": -1 });

// Create and export the Company model
const Company = mongoose.model("Company", companySchema);

export default Company;