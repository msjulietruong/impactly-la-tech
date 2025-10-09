import mongoose from 'mongoose';

// Product cache schema for storing lookup results
const productCacheSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
    description: 'Product identifier (barcode, UPC, EAN, GTIN, or search query)'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    description: 'Cached product data in normalized format'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// TTL index - automatically delete cache entries after 7 days
productCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 604800 });

// Create and export the ProductCache model
const ProductCache = mongoose.model("ProductCache", productCacheSchema);

export default ProductCache;
