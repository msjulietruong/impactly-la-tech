import axios from 'axios';
import ProductCache from '../models/ProductCache.js';

class OpenFoodFactsService {
  constructor() {
    this.env = process.env.OFF_ENV || 'staging';
    this.userAgent = process.env.OFF_USER_AGENT || 'EthicalProductFinder/0.1 (you@example.com)';

    this.baseConfig = {
      headers: {
        'User-Agent': this.userAgent,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    if (this.env === 'staging') {
      this.baseURL = 'https://world.openfoodfacts.net/api/v2';
      this.baseConfig.auth = {
        username: 'off',
        password: 'off'
      };
    } else {
      this.baseURL = 'https://world.openfoodfacts.org/api/v2';
    }
  }

  async lookupProduct(params) {
    const { upc, ean, gtin, q } = params;

    // Validate input parameters
    if (!upc && !ean && !gtin && !q) {
      throw {
        code: 'INVALID_ARGUMENT',
        message: 'Missing required parameters. Provide either upc, ean, gtin, or q',
        status: 400
      };
    }

    // Check cache first
    const cacheKey = upc || ean || gtin || q;
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    let result;

    if (q) {
      // Text search
      result = await this.searchByText(q);
    } else {
      // Barcode lookup
      const barcode = upc || ean || gtin;
      result = await this.getByBarcode(barcode);
    }

    // Normalize the response
    const normalized = this.normalizeProduct(result, upc || ean || gtin || q);

    // Cache the result
    await this.setCache(cacheKey, normalized);

    return normalized;
  }

  async getByBarcode(barcode) {
    try {
      const response = await axios.get(`${this.baseURL}/product/${barcode}.json`, this.baseConfig);

      if (response.status === 404 || !response.data.product) {
        throw {
          code: 'NOT_FOUND',
          message: `Product not found for barcode: ${barcode}`,
          status: 404
        };
      }

      return response.data.product;
    } catch (error) {
      if (error.response?.status === 404) {
        throw {
          code: 'NOT_FOUND',
          message: `Product not found for barcode: ${barcode}`,
          status: 404
        };
      }
      throw {
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'Failed to fetch product from OpenFoodFacts',
        details: error.message,
        status: 500
      };
    }
  }

  async searchByText(query) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        ...this.baseConfig,
        params: {
          fields: 'code,product_name,brands,categories,image_url',
          page_size: 10,
          search_terms: query
        }
      });

      if (!response.data.products || response.data.products.length === 0) {
        throw {
          code: 'NOT_FOUND',
          message: `No products found for query: ${query}`,
          status: 404
        };
      }

      // For now, return the first product
      // In a real implementation, you might want to handle multiple results
      return response.data.products[0];
    } catch (error) {
      if (error.response?.status === 404) {
        throw {
          code: 'NOT_FOUND',
          message: `No products found for query: ${query}`,
          status: 404
        };
      }
      throw {
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'Failed to search products from OpenFoodFacts',
        details: error.message,
        status: 500
      };
    }
  }

  normalizeProduct(product, identifier) {
    const code = product.code || identifier;
    const brands = product.brands || product.brand || '';
    const brandList = brands.split(',').map(b => b.trim()).filter(Boolean);

    // Determine barcode type and value
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

    // Simple brand resolution logic - in real implementation this would be more sophisticated
    const companyResolution = this.resolveCompany(brandList);

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

  resolveCompany(brands) {
    // This is a stub implementation
    // In a real system, this would query a company database
    // and potentially return ambiguous results if multiple companies match

    if (brands.length === 0) {
      return {
        resolution: 'unresolved',
        companyId: null,
        candidates: []
      };
    }

    // For now, always return as unresolved with the brand as a candidate
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

  async getFromCache(code) {
    try {
      const cached = await ProductCache.findOne({ code });
      return cached ? cached.data : null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  async setCache(code, data) {
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
}

export default new OpenFoodFactsService();
