import axios from 'axios';
import ProductCache from '../models/ProductCache.js';

// OpenFoodFacts API configuration
const API_CONFIG = {
  baseURL: process.env.OFF_ENV === 'staging' 
    ? 'https://world.openfoodfacts.net/api/v2'
    : 'https://world.openfoodfacts.org/api/v2',
  timeout: 10000,
  headers: {
    'User-Agent': process.env.OFF_USER_AGENT || 'EthicalProductFinder/0.1 (you@example.com)',
    'Content-Type': 'application/json'
  }
};

// Add authentication for staging environment
if (process.env.OFF_ENV === 'staging') {
  API_CONFIG.auth = {
    username: 'off',
    password: 'off'
  };
}

// Look up product by barcode or search query
export async function lookupProduct(params) {
  const { upc, ean, gtin, q } = params;

  // Validate input parameters
  if (!upc && !ean && !gtin && !q) {
    const error = new Error('Missing required parameters. Provide either upc, ean, gtin, or q');
    error.code = 'INVALID_ARGUMENT';
    throw error;
  }

  // Check cache first
  const cacheKey = upc || ean || gtin || q;
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  let result;

  try {
    if (q) {
      // Search by text query
      result = await searchByText(q);
    } else {
      // Look up by barcode
      const barcode = upc || ean || gtin;
      result = await getByBarcode(barcode);
    }

    // Convert to our standard format
    const product = normalizeProduct(result, upc || ean || gtin || q);

    // Save to cache
    await setCache(cacheKey, product);

    return product;

  } catch (error) {
    // Re-throw the error with proper code
    if (error.response?.status === 404) {
      const notFoundError = new Error(`Product not found: ${cacheKey}`);
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    if (error.response?.status === 429) {
      const rateLimitError = new Error('OpenFoodFacts API rate limit exceeded');
      rateLimitError.code = 'RATE_LIMITED';
      throw rateLimitError;
    }

    // Default error
    const serviceError = new Error('Failed to fetch product from OpenFoodFacts');
    serviceError.code = 'EXTERNAL_SERVICE_ERROR';
    throw serviceError;
  }
}

// Get product by barcode from OpenFoodFacts API
async function getByBarcode(barcode) {
  try {
    const response = await axios.get(`${API_CONFIG.baseURL}/product/${barcode}.json`, API_CONFIG);

    if (response.status === 404 || !response.data.product) {
      const error = new Error(`Product not found for barcode: ${barcode}`);
      error.code = 'NOT_FOUND';
      throw error;
    }

    return response.data.product;
  } catch (error) {
    if (error.response?.status === 404) {
      const notFoundError = new Error(`Product not found for barcode: ${barcode}`);
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    if (error.response?.status === 429) {
      const rateLimitError = new Error('OpenFoodFacts API rate limit exceeded');
      rateLimitError.code = 'RATE_LIMITED';
      throw rateLimitError;
    }

    // Default error
    const serviceError = new Error('Failed to fetch product from OpenFoodFacts');
    serviceError.code = 'EXTERNAL_SERVICE_ERROR';
    throw serviceError;
  }
}

// Search products by text query from OpenFoodFacts API
async function searchByText(query) {
  try {
    const response = await axios.get(`${API_CONFIG.baseURL}/search`, {
      ...API_CONFIG,
      params: {
        fields: 'code,product_name,brands,categories,image_url,image_front_url',
        page_size: 10,
        search_terms: query
      }
    });

    if (!response.data.products || response.data.products.length === 0) {
      const error = new Error(`No products found for query: ${query}`);
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Return the first matching product
    return response.data.products[0];
  } catch (error) {
    if (error.response?.status === 404) {
      const notFoundError = new Error(`No products found for query: ${query}`);
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    if (error.response?.status === 429) {
      const rateLimitError = new Error('OpenFoodFacts API rate limit exceeded');
      rateLimitError.code = 'RATE_LIMITED';
      throw rateLimitError;
    }

    // Default error
    const serviceError = new Error('Failed to search products from OpenFoodFacts');
    serviceError.code = 'EXTERNAL_SERVICE_ERROR';
    throw serviceError;
  }
}

// Convert OpenFoodFacts product data to our standard format
function normalizeProduct(product, identifier) {
  const code = product.code || identifier;
  const brands = product.brands || product.brand || '';
  const brandList = brands.split(',').map(b => b.trim()).filter(Boolean);

  // Determine barcode type based on identifier length
  let barcodeType, barcodeValue;
  if (identifier) {
    if (/^\d{12}$/.test(identifier)) {
      barcodeType = 'upc';
    } else if (/^\d{13}$/.test(identifier)) {
      barcodeType = 'ean';
    } else {
      barcodeType = 'gtin';
    }
    barcodeValue = identifier;
  } else {
    barcodeType = 'gtin';
    barcodeValue = code;
  }

  // Simple company resolution (placeholder for future enhancement)
  const companyResolution = resolveCompany(brandList);

  return {
    id: code,
    barcode: {
      type: barcodeType,
      value: barcodeValue
    },
    name: product.product_name || product.name || 'Unknown Product',
    brand: brandList[0] || 'Unknown Brand',
    brandAliases: brandList.slice(1),
    category: product.categories || product.category || 'Unknown Category',
    imageUrl: product.image_url || product.image_front_url || null,
    company: companyResolution,
    source: {
      name: 'OpenFoodFacts',
      recordId: code,
      lastUpdated: product.last_modified_t || new Date().toISOString()
    }
  };
}

// Simple company resolution (placeholder for future enhancement)
function resolveCompany(brands) {
  if (brands.length === 0) {
    return {
      resolution: 'unresolved',
      companyId: null,
      candidates: []
    };
  }

  // For now, return as unresolved with brands as candidates
  return {
    resolution: 'unresolved',
    companyId: null,
    candidates: brands.map(brand => ({
      companyId: `stub_${brand.toLowerCase().replace(/\s+/g, '_')}`,
      confidence: 0.5,
      name: brand
    }))
  };
}

// Get product from cache
async function getFromCache(code) {
  try {
    const cached = await ProductCache.findOne({ code });
    return cached ? cached.data : null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

// Save product to cache
async function setCache(code, data) {
  try {
    await ProductCache.findOneAndUpdate(
      { code },
      { code, data, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Cache write error:', error);
    // Don't throw - caching is not critical for functionality
  }
}
