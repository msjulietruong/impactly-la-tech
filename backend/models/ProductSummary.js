import mongoose from 'mongoose';

/**
 * PRODUCT SUMMARY MODEL
 * 
 * This model stores AI-generated summaries for products.
 * Summaries are cached to avoid regenerating them on every request.
 * 
 * Features:
 * - Automatic expiration after 30 days (TTL index)
 * - Stores both short and long-form summaries
 * - Tracks summary version for future updates
 * - Records generation metadata (model, tokens, etc.)
 */

const productSummarySchema = new mongoose.Schema({
  // Product identifier (barcode or product ID)
  productId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    description: 'Product barcode or unique identifier'
  },

  // Product basic info (for quick reference)
  productName: {
    type: String,
    required: true,
    description: 'Product name at time of summary generation'
  },

  brand: {
    type: String,
    description: 'Product brand at time of summary generation'
  },

  // Summary content
  shortSummary: {
    type: String,
    description: 'Brief 1-2 sentence summary'
  },

  longSummary: {
    type: String,
    required: true,
    description: 'Detailed AI-generated summary covering ethical considerations, health info, etc.'
  },

  // Structured summary sections
  sections: {
    overview: {
      type: String,
      description: 'Product overview and description'
    },
    ethicalConsiderations: {
      type: String,
      description: 'ESG factors, company ethics, sustainability'
    },
    healthInfo: {
      type: String,
      description: 'Nutritional information and health considerations'
    },
    alternatives: {
      type: String,
      description: 'Suggested alternatives and why'
    }
  },

  // Generation metadata
  generationMeta: {
    model: {
      type: String,
      description: 'AI model used (e.g., gpt-4, claude-3)'
    },
    version: {
      type: String,
      default: '1.0.0',
      description: 'Summary schema version'
    },
    tokensUsed: {
      type: Number,
      description: 'Number of tokens used in generation'
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      description: 'When the summary was generated'
    },
    generatedBy: {
      type: String,
      default: 'system',
      description: 'User or system that triggered generation'
    }
  },

  // Data sources used in summary
  dataSources: {
    productData: {
      type: Boolean,
      default: false,
      description: 'OpenFoodFacts data included'
    },
    esgData: {
      type: Boolean,
      default: false,
      description: 'Company ESG data included'
    },
    externalSources: {
      type: [String],
      description: 'Additional sources consulted'
    }
  }

}, {
  timestamps: true // Adds createdAt and updatedAt
});

// TTL index - automatically delete summaries after 30 days
// This ensures summaries stay fresh and reflect current data
productSummarySchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });

// Index for quick lookups by product
productSummarySchema.index({ productId: 1 });

// Create and export the ProductSummary model
const ProductSummary = mongoose.model("ProductSummary", productSummarySchema);

export default ProductSummary;


