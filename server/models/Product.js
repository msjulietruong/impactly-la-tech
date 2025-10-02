const mongoose = require('mongoose');

const barcodeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['upc', 'ean', 'gtin'],
    required: true
  },
  value: {
    type: String,
    required: true
  }
});

const companySchema = new mongoose.Schema({
  resolution: {
    type: String,
    enum: ['resolved', 'ambiguous', 'unresolved'],
    required: true
  },
  companyId: {
    type: String,
    required: false
  },
  candidates: [{
    companyId: String,
    confidence: Number,
    name: String
  }]
});

const sourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  recordId: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    required: true
  }
});

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  barcode: {
    type: barcodeSchema,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: false
  },
  brandAliases: [String],
  category: {
    type: String,
    required: false
  },
  imageUrl: {
    type: String,
    required: false
  },
  company: {
    type: companySchema,
    required: true
  },
  source: {
    type: sourceSchema,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
