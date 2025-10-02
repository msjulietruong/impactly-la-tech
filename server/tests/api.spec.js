const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Company = require('../models/Company');

describe('API Smoke Tests', () => {
  let testCompanyId;
  let testTicker;

  beforeAll(async () => {
    // Only skip DB tests if MONGODB_URI is not set
    if (!process.env.MONGODB_URI) {
      console.log('MONGODB_URI not set, skipping database-dependent tests');
      return;
    }

    try {
      // Connect to test database
      const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ethical-product-finder-test';
      await mongoose.connect(mongoURI, { 
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        connectTimeoutMS: 5000 
      });
      
      // Use TEST_TICKER from environment or default to MSFT
      const targetTicker = process.env.TEST_TICKER || 'MSFT';
      
      // Find a company with the target ticker and ESG data
      const companyWithESG = await Company.findOne({
        tickers: { $regex: new RegExp(`^${targetTicker}$`, 'i') },
        'esgSources.0': { $exists: true }
      });
      
      if (companyWithESG) {
        testCompanyId = companyWithESG._id.toString();
        testTicker = companyWithESG.tickers[0];
      } else {
        // Fallback: find any company with ESG data
        const fallbackCompany = await Company.findOne({
          'esgSources.0': { $exists: true },
          tickers: { $exists: true, $ne: [] }
        });
        
        if (fallbackCompany) {
          testCompanyId = fallbackCompany._id.toString();
          testTicker = fallbackCompany.tickers[0];
        }
      }
    } catch (error) {
      console.log('MongoDB connection failed, running tests without database-dependent features');
      // Continue with tests that don't require MongoDB
    }
  }, 10000);

  afterAll(async () => {
    // Close database connection if it exists
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('GET /v1/lookup', () => {
    it('should return 200 with normalized product shape for valid UPC', async () => {
      const response = await request(app)
        .get('/v1/lookup')
        .query({ upc: '3274080005003' })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('brand');
      expect(response.body).toHaveProperty('barcode');
      expect(response.body.barcode).toHaveProperty('type');
      expect(response.body.barcode).toHaveProperty('value');
      expect(response.body).toHaveProperty('source');
      expect(response.body.source).toHaveProperty('name', 'OpenFoodFacts');
      expect(response.body.source).toHaveProperty('recordId');
      expect(response.body.source).toHaveProperty('lastUpdated');
    }, 30000); // 30 second timeout for external API call

    it('should return 400 with INVALID_ARGUMENT error when no params provided', async () => {
      const response = await request(app)
        .get('/v1/lookup')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_ARGUMENT');
      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('GET /v1/company', () => {
    it('should return 200 with company data when searching by ticker', async () => {
      if (!process.env.MONGODB_URI || !testTicker) {
        console.log('Skipping ticker test - no company with ESG data found or MongoDB not available');
        return;
      }

      const response = await request(app)
        .get('/v1/company')
        .query({ ticker: testTicker })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('aliases');
      expect(response.body).toHaveProperty('tickers');
      expect(response.body).toHaveProperty('esgSources');
      expect(response.body.tickers).toContain(testTicker);
      expect(Array.isArray(response.body.esgSources)).toBe(true);
      
      if (response.body.esgSources.length > 0) {
        const esgSource = response.body.esgSources[0];
        expect(esgSource).toHaveProperty('raw');
        expect(esgSource.raw).toHaveProperty('E');
        expect(esgSource.raw).toHaveProperty('S');
        expect(esgSource.raw).toHaveProperty('G');
        expect(esgSource.raw).toHaveProperty('scale', '0-100');
        
        // E, S, G should be numbers or null
        const { E, S, G } = esgSource.raw;
        expect([E, S, G].every(val => typeof val === 'number' || val === null)).toBe(true);
      }
    });

    it('should return 200 with matches array when searching by query', async () => {
      if (!process.env.MONGODB_URI) {
        console.log('Skipping company search test - MongoDB not available');
        return;
      }

      const response = await request(app)
        .get('/v1/company')
        .query({ q: 'nestle' });

      if (response.status !== 200) {
        console.log('Company search error response:', response.body);
      }
      
      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty('matches');
      expect(Array.isArray(response.body.matches)).toBe(true);
      
      // If matches exist, validate structure
      if (response.body.matches.length > 0) {
        const company = response.body.matches[0];
        expect(company).toHaveProperty('id');
        expect(company).toHaveProperty('name');
        expect(company).toHaveProperty('aliases');
        expect(company).toHaveProperty('tickers');
        expect(company).toHaveProperty('domains');
        expect(company).toHaveProperty('esgSources');
        expect(company).toHaveProperty('meta');
        expect(company.meta).toHaveProperty('createdAt');
        expect(company.meta).toHaveProperty('updatedAt');
      }
    });

    it('should return 400 with INVALID_ARGUMENT when no query params provided', async () => {
      const response = await request(app)
        .get('/v1/company')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_ARGUMENT');
      expect(response.body.error).toHaveProperty('message');
    });
  });

  describe('GET /v1/score/:companyId', () => {
    it('should return 200 with score data for valid company', async () => {
      if (!process.env.MONGODB_URI || !testCompanyId) {
        console.log('Skipping score test - no company with ESG data found or MongoDB not available');
        return;
      }

      const response = await request(app)
        .get(`/v1/score/${testCompanyId}`)
        .expect(200);

      expect(response.body).toHaveProperty('companyId', testCompanyId);
      expect(response.body).toHaveProperty('overall');
      expect(response.body).toHaveProperty('breakdown');
      expect(response.body).toHaveProperty('methodology');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('asOf');
      expect(response.body).toHaveProperty('lastUpdated');

      // Validate breakdown structure
      expect(response.body.breakdown).toHaveProperty('environment');
      expect(response.body.breakdown).toHaveProperty('labor');
      expect(response.body.breakdown).toHaveProperty('governance');

      // Validate methodology
      expect(response.body.methodology).toHaveProperty('version', '1.0.0');
      expect(response.body.methodology).toHaveProperty('weights');
      expect(response.body.methodology.weights).toEqual({
        environment: 0.4,
        labor: 0.4,
        governance: 0.2
      });

      // Validate confidence range
      expect(response.body.confidence).toBeGreaterThanOrEqual(0.8);
      expect(response.body.confidence).toBeLessThanOrEqual(0.95);

      // Validate overall score is a number
      expect(typeof response.body.overall).toBe('number');

      // If company has all-null E/S/G, expect 404 instead
      const esgSource = response.body.breakdown;
      const allNull = esgSource.environment === null && esgSource.labor === null && esgSource.governance === null;
      
      if (allNull) {
        // Re-run the test expecting 404
        const response404 = await request(app)
          .get(`/v1/score/${testCompanyId}`)
          .expect(404);
        
        expect(response404.body).toHaveProperty('error');
        expect(response404.body.error).toHaveProperty('code', 'NOT_FOUND');
      }
    });

    it('should return 404 for non-existent company', async () => {
      if (!process.env.MONGODB_URI) {
        console.log('Skipping non-existent company test - MongoDB not available');
        return;
      }

      const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but non-existent
      
      const response = await request(app)
        .get(`/v1/score/${fakeId}`);

      if (response.status !== 404) {
        console.log('Score error response:', response.body);
      }
      
      expect(response.status).toBe(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body.error).toHaveProperty('message');
    });

    it('should return 404 for company without ESG data', async () => {
      if (!process.env.MONGODB_URI) {
        console.log('Skipping ESG data test - MongoDB not available');
        return;
      }

      // Create a test company without ESG data
      const companyWithoutESG = new Company({
        name: 'Test Company Without ESG',
        aliases: ['Test Company'],
        tickers: ['TEST'],
        country: null,
        domains: [],
        esgSources: []
      });
      
      await companyWithoutESG.save();
      
      try {
        const response = await request(app)
          .get(`/v1/score/${companyWithoutESG._id}`)
          .expect(404);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
        expect(response.body.error.message).toContain('No ESG data found');
      } finally {
        // Clean up test company
        await Company.findByIdAndDelete(companyWithoutESG._id);
      }
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body.error).toHaveProperty('message');
    });
  });
});
