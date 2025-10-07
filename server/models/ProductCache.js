import mongoose from 'mongoose';

const productCacheSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
}, {
  timestamps: true
});

// TTL index for automatic cleanup after seven days
productCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 604800 });

const ProductCache = mongoose.model("ProductCache", productCacheSchema);
export default ProductCache;
