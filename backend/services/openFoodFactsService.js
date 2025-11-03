/**
 * ========================================
 * PRODUCT LOOKUP SERVICE
 * ========================================
 * 
 * What this does:
 * - Queries our MongoDB database for food products
 * - Lets us search for products by name or barcode
 * - Caches results in our database so future searches are faster
 * 
 * How it works:
 * 1. Someone asks for a product
 * 2. We check our cache first (faster!)
 * 3. If not in cache, we query the database
 * 4. We save the result to cache for next time
 * 5. We return the product info
 */

import mongoose from 'mongoose';              // MongoDB connection
import ProductCache from '../models/ProductCache.js';  // Our cache database model

// ============================================================================
// DATABASE ACCESS
// ============================================================================

/**
 * Get the food collection from MongoDB
 */
function getFoodCollection() {
  return mongoose.connection.db.collection('food');
}

// ============================================================================
// MAIN FUNCTION: Look up product
// ============================================================================
/**
 * FUNCTION: Look up a product by barcode or text search
 * 
 * What it does:
 * 1. Checks our cache first (super fast!)
 * 2. If not in cache, queries the database
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

  // STEP 3: Check our cache first (much faster than querying the database!)
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

  // STEP 4: Not in cache, so we need to query the database
  try {
    if (q) {
      // They gave us a search term like "chocolate"
      // searchByText now returns an array of products
      const products = await searchByText(q);
      
      // Ensure we got an array
      if (!Array.isArray(products)) {
        throw new Error('Search returned invalid format');
      }
      
      // Normalize all products and return as array
      const normalizedProducts = products
        .filter(product => product != null) // Filter out any null/undefined products
        .map(product => {
          try {
            return normalizeProduct(product, product.code?.toString() || q);
          } catch (error) {
            console.error('Error normalizing product:', error);
            return null;
          }
        })
        .filter(product => product != null); // Filter out any failed normalizations
      
      if (normalizedProducts.length === 0) {
        const error = new Error(`No products found for query: ${q}`);
        error.code = 'NOT_FOUND';
        throw error;
      }
      
      // Don't cache search results (they change frequently)
      return normalizedProducts;
    } else {
      // They gave us a barcode (upc, ean, or gtin)
      const barcode = upc || ean || gtin;
      const result = await getByBarcode(barcode);

      // STEP 5: Convert the database format to our standard format
      const product = normalizeProduct(result, barcode);

      // STEP 6: Save to cache so next time is faster (only for barcodes)
      await setCache(cacheKey, product);

      // STEP 7: Return the product!
      return product;
    }

  } catch (error) {
    // STEP 8: Handle different types of errors

    // Error: Product not found
    if (error.code === 'NOT_FOUND') {
      throw error;
    }

    // Some other error we don't recognize
    const serviceError = new Error('Failed to fetch product from database');
    serviceError.code = 'DATABASE_ERROR';
    throw serviceError;
  }
}

// Get product by barcode from database
async function getByBarcode(barcode) {
  try {
    const foodCollection = getFoodCollection();
    
    // Convert barcode to number (database stores code as number)
    const codeNumber = parseInt(barcode);
    if (isNaN(codeNumber)) {
      const error = new Error(`Invalid barcode format: ${barcode}`);
      error.code = 'INVALID_ARGUMENT';
      throw error;
    }

    // Query database for product by code
    const product = await foodCollection.findOne({ code: codeNumber });

    if (!product) {
      const error = new Error(`Product not found for barcode: ${barcode}`);
      error.code = 'NOT_FOUND';
      throw error;
    }

    return product;
  } catch (error) {
    // Re-throw if it's already a formatted error
    if (error.code === 'NOT_FOUND' || error.code === 'INVALID_ARGUMENT') {
      throw error;
    }

    // Database connection or other error
    const serviceError = new Error('Failed to fetch product from database');
    serviceError.code = 'DATABASE_ERROR';
    throw serviceError;
  }
}

// Search products by text query from database
async function searchByText(query) {
  try {
    const foodCollection = getFoodCollection();
    
    // Escape special regex characters in the query to prevent regex injection
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Search in product_name, brands, and categories fields
    // Use word boundary matching for better results
    const products = await foodCollection
      .find({
        $or: [
          { product_name: { $regex: escapedQuery, $options: 'i' } },
          { brands: { $regex: escapedQuery, $options: 'i' } },
          { categories: { $regex: escapedQuery, $options: 'i' } }
        ]
      })
      .limit(50) // Increased limit to 50 results
      .toArray();

    if (!products || products.length === 0) {
      const error = new Error(`No products found for query: ${query}`);
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Return ALL matching products (not just the first one)
    return products;
  } catch (error) {
    // Re-throw if it's already a formatted error
    if (error.code === 'NOT_FOUND') {
      throw error;
    }

    // Database connection or other error
    console.error('Search error:', error);
    const serviceError = new Error('Failed to search products from database');
    serviceError.code = 'DATABASE_ERROR';
    throw serviceError;
  }
}

// Convert database product data to our standard format
function normalizeProduct(product, identifier) {
  // Handle code - database stores it as number, convert to string
  const code = product.code ? product.code.toString() : (identifier && identifier.toString() !== 'undefined' ? identifier.toString() : '');
  const brands = product.brands || '';
  const brandList = typeof brands === 'string' 
    ? brands.split(',').map(b => b.trim()).filter(Boolean)
    : [];

  // Determine barcode type based on identifier or code
  let barcodeType, barcodeValue;
  const codeStr = code.toString();
  
  if (codeStr && /^\d+$/.test(codeStr)) {
    // Has a valid numeric code
    if (/^\d{12}$/.test(codeStr)) {
      barcodeType = 'upc';
    } else if (/^\d{13}$/.test(codeStr)) {
      barcodeType = 'ean';
    } else {
      barcodeType = 'gtin';
    }
    barcodeValue = codeStr;
  } else if (identifier && identifier.toString() !== 'undefined' && /^\d+$/.test(identifier.toString())) {
    // Use identifier if code is not valid
    const identifierStr = identifier.toString();
    if (/^\d{12}$/.test(identifierStr)) {
      barcodeType = 'upc';
    } else if (/^\d{13}$/.test(identifierStr)) {
      barcodeType = 'ean';
    } else {
      barcodeType = 'gtin';
    }
    barcodeValue = identifierStr;
  } else {
    // Default fallback
    barcodeType = 'gtin';
    barcodeValue = codeStr || 'unknown';
  }

  // Simple company resolution (placeholder for future enhancement)
  const companyResolution = resolveCompany(brandList);

  return {
    id: code || 'unknown',
    barcode: {
      type: barcodeType,
      value: barcodeValue
    },
    name: product.product_name || 'Unknown Product',
    brand: brandList[0] || 'Unknown Brand',
    brandAliases: brandList.slice(1),
    category: product.categories || 'Unknown Category',
    imageUrl: product.image_url || null,
    company: companyResolution,
    source: {
      name: 'Database',
      recordId: code || 'unknown',
      lastUpdated: new Date().toISOString()
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
// Caching makes searches MUCH faster!

/**
 * FUNCTION: Get product from cache
 * 
 * What it does:
 * - Looks in our MongoDB database for a cached product
 * - Returns the product if found, or null if not found
 * 
 * Why we cache:
 * - Querying the database takes time
 * - Reading from our cache takes only 0.1 seconds
 * - That's much faster!
 */
async function getFromCache(code) {
  try {
    // Look for a cached product with this code (barcode or search term)
    const cached = await ProductCache.findOne({ code: code.toString() });
    
    // If found, return the saved data. If not found, return null
    return cached ? cached.data : null;
  } catch (error) {
    // If something goes wrong, just log it and return null
    // (We can still get the product from the database)
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
      { code: code.toString() },            // Find by this code (as string)
      { code: code.toString(), data, updatedAt: new Date() }, // Update with this data
      { upsert: true, new: true }            // upsert = create if doesn't exist
    );
  } catch (error) {
    // If caching fails, that's OK - we still returned the product!
    // Just log the error and continue (don't throw)
    console.error('Cache write error:', error);
    // Don't throw - caching is not critical for functionality
  }
}
