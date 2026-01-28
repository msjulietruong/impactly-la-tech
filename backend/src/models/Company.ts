import mongoose from "mongoose";

// Main company/ESG schema
const companySchema = new mongoose.Schema(
  {
    ticker: {
      type: String,
      required: true,
      description: 'Stock ticker symbol (e.g., "gm")',
    },
    name: {
      type: String,
      required: true,
      description: 'Official company name (e.g., "General Motors Co")',
    },
    logo: {
      type: String,
      description: "Company logo URL",
    },
    weburl: {
      type: String,
      description: "Company website URL",
    },
    environment_grade: {
      type: String,
      description: "Environmental grade (A, B, C, etc.)",
    },
    environment_level: {
      type: String,
      description: "Environmental level (High, Medium, Low)",
    },
    social_grade: {
      type: String,
      description: "Social grade (A, B, C, etc.)",
    },
    social_level: {
      type: String,
      description: "Social level (High, Medium, Low)",
    },
    governance_grade: {
      type: String,
      description: "Governance grade (A, B, C, etc.)",
    },
    governance_level: {
      type: String,
      description: "Governance level (High, Medium, Low)",
    },
    environment_score: {
      type: Number,
      min: 0,
      max: 100,
      description: "Environmental score (0-100)",
    },
    social_score: {
      type: Number,
      min: 0,
      max: 100,
      description: "Social score (0-100)",
    },
    governance_score: {
      type: Number,
      min: 0,
      max: 100,
      description: "Governance score (0-100)",
    },
    total_score: {
      type: Number,
      min: 0,
      max: 100,
      description: "Total ESG score (0-100)",
    },
    last_processing_date: {
      type: String,
      description: 'Date when ESG data was last processed (e.g., "04/17/2022")',
    },
    total_grade: {
      type: String,
      description: "Overall grade (A, BBB, etc.)",
    },
    total_level: {
      type: String,
      description: "Overall level (High, Medium, Low)",
    },
    cik: {
      type: Number,
      description: "SEC Central Index Key number",
    },
  },
  {
    timestamps: true,
    collection: "esg_scores", // Explicitly set collection name
  }
);

// Database indexes for better performance
companySchema.index({ ticker: 1 });
companySchema.index({ name: 1 });
companySchema.index({ name: "text" }); // Text search index

// Create and export the Company model
const Company = mongoose.model("Company", companySchema, "esg_scores");

export default Company;
