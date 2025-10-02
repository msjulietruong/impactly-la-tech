const mongoose = require('mongoose');

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
  updatedAt: {
    type: Date,
    default: Date.now,
    index: { expireAfterSeconds: 604800 } // 7 days TTL
  }
}, {
  timestamps: true
});

// TTL index for automatic cleanup after 7 days
productCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('ProductCache', productCacheSchema);
