/**
 * ========================================
 * OPEN FOOD FACTS SERVICE
 * ========================================
 * 
 * What this does:
 * - Talks to the OpenFoodFacts API (a huge database of food products)
 * - Lets us search for products by name or barcode
 * - Caches results in our database so future searches are faster
 * 
 * What is OpenFoodFacts?
 * - A free, open database of food products from around the world
 * - Like Wikipedia but for food - anyone can contribute
 * - Has millions of products with barcodes, ingredients, nutrition info
 * 
 * How it works:
 * 1. Someone asks for a product
 * 2. We check our cache first (faster!)
 * 3. If not in cache, we ask OpenFoodFacts
 * 4. We save the result to cache for next time
 * 5. We return the product info
 */

import axios from 'axios';                    // Tool for making HTTP requests
import ProductCache from '../models/ProductCache.js';  // Our cache database model

// ============================================================================
// CONFIGURATION
// ============================================================================
// Set up how we talk to the OpenFoodFacts API

const API_CONFIG = {
  // Which server to use? 
  // - staging (testing) = world.openfoodfacts.net
  // - production (real) = world.openfoodfacts.org
  baseURL: process.env.OFF_ENV === 'staging' 
    ? 'https://world.openfoodfacts.net/api/v2'    // Testing server
    : 'https://world.openfoodfacts.org/api/v2',   // Real server
  
  timeout: 10000,  // Wait max 10 seconds for a response
  
  headers: {
    // Tell OpenFoodFacts who we are (required by their API)
    'User-Agent': process.env.OFF_USER_AGENT || 'EthicalProductFinder/0.1 (you@example.com)',
    'Content-Type': 'application/json'  // We send/receive JSON data
  }
};

// If using staging server, we need to provide login credentials
if (process.env.OFF_ENV === 'staging') {
  API_CONFIG.auth = {
    username: 'off',  // Staging username
    password: 'off'   // Staging password
  };
}

// ============================================================================
// MAIN FUNCTION: Look up product
// ============================================================================
/**
 * FUNCTION: Look up a product by barcode or text search
 * 
 * What it does:
 * 1. Checks our cache first (super fast!)
 * 2. If not in cache, asks OpenFoodFacts API
 * 3. Saves result to cache for next time
 * 4. Returns product information
 * 
 * How to use:
 *   lookupProduct({ upc: '3274080005003' })        // Find by barcode
 *   lookupProduct({ q: 'chocolate' })               // Search by text
 * 
 * What it returns:
 *   Product object with name, brand, image, etc.
 */
export async function lookupProduct(params) {
  // STEP 1: Extract the search parameters
  const { upc, ean, gtin, q } = params;
  // upc = Universal Product Code (12 digits)
  // ean = European Article Number (13 digits)
  // gtin = Global Trade Item Number (general barcode)
  // q = search query (like "chocolate" or "coca cola")

  // STEP 2: Make sure they gave us SOMETHING to search for
  if (!upc && !ean && !gtin && !q) {
    const error = new Error('Missing required parameters. Provide either upc, ean, gtin, or q');
    error.code = 'INVALID_ARGUMENT';
    throw error;
  }

  // STEP 3: Check our cache first (much faster than calling the API!)
  // NOTE: Only cache barcode lookups, NOT text searches (to avoid stale results)
  const cacheKey = upc || ean || gtin;
  let cached = null;
  
  if (cacheKey) {
    // Only check cache for barcode lookups
    cached = await getFromCache(cacheKey);
    if (cached) {
      return cached;  // Found it in cache! Return immediately
    }
  }

  // STEP 4: Not in cache, so we need to call OpenFoodFacts API
  let result;

  try {
    if (q) {
      // They gave us a search term like "chocolate"
      // searchByText now returns an array of products
      const products = await searchByText(q);
      
      // Normalize all products and return as array
      const normalizedProducts = products.map(product => 
        normalizeProduct(product, product.code || q)
      );
      
      // Don't cache search results (they change frequently)
      return normalizedProducts;
    } else {
      // They gave us a barcode (upc, ean, or gtin)
      const barcode = upc || ean || gtin;
      result = await getByBarcode(barcode);

      // STEP 5: Convert the OpenFoodFacts format to our standard format
      // (OpenFoodFacts uses different field names than we do)
      const product = normalizeProduct(result, barcode);

      // STEP 6: Save to cache so next time is faster (only for barcodes)
      await setCache(cacheKey, product);

      // STEP 7: Return the product!
      return product;
    }

  } catch (error) {
    // STEP 8: Handle different types of errors

    // Error 404 = Product not found
    if (error.response?.status === 404) {
      const notFoundError = new Error(`Product not found: ${cacheKey}`);
      notFoundError.code = 'NOT_FOUND';
      throw notFoundError;
    }

    // Error 429 = We made too many requests (rate limit)
    if (error.response?.status === 429) {
      const rateLimitError = new Error('OpenFoodFacts API rate limit exceeded');
      rateLimitError.code = 'RATE_LIMITED';
      throw rateLimitError;
    }

    // Some other error we don't recognize
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
        page_size: 20, // Increased from 10 to get more results
        search_terms: query
      }
    });

    if (!response.data.products || response.data.products.length === 0) {
      const error = new Error(`No products found for query: ${query}`);
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Return ALL matching products (not just the first one)
    return response.data.products;
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

// ============================================================================
// CACHE FUNCTIONS
// ============================================================================
// These functions save and retrieve products from our MongoDB cache
// Caching makes searches MUCH faster (no need to call OpenFoodFacts again!)

/**
 * FUNCTION: Get product from cache
 * 
 * What it does:
 * - Looks in our MongoDB database for a cached product
 * - Returns the product if found, or null if not found
 * 
 * Why we cache:
 * - Calling OpenFoodFacts API takes 1-2 seconds
 * - Reading from our cache takes only 0.1 seconds
 * - That's 10-20x faster!
 */
async function getFromCache(code) {
  try {
    // Look for a cached product with this code (barcode or search term)
    const cached = await ProductCache.findOne({ code });
    
    // If found, return the saved data. If not found, return null
    return cached ? cached.data : null;
  } catch (error) {
    // If something goes wrong, just log it and return null
    // (We can still get the product from OpenFoodFacts)
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * FUNCTION: Save product to cache
 * 
 * What it does:
 * - Saves a product to our MongoDB database for future use
 * - Uses "upsert" which means "update if exists, insert if new"
 * 
 * Why we use findOneAndUpdate:
 * - If product already in cache → update it with new data
 * - If product not in cache → create a new entry
 * - No need to check if it exists first!
 */
async function setCache(code, data) {
  try {
    await ProductCache.findOneAndUpdate(
      { code },                              // Find by this code
      { code, data, updatedAt: new Date() }, // Update with this data
      { upsert: true, new: true }            // upsert = create if doesn't exist
    );
  } catch (error) {
    // If caching fails, that's OK - we still returned the product!
    // Just log the error and continue (don't throw)
    console.error('Cache write error:', error);
    // Don't throw - caching is not critical for functionality
  }
}
