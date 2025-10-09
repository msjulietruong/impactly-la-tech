import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';

describe('New API Endpoints', () => {
  
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/products', () => {
    it('should return 200 with product data when searching by query param', async () => {
      const response = await request(app)
        .get('/api/products?q=water')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('brand');
    });

    it('should return 200 with product data when searching by upc param', async () => {
      const response = await request(app)
        .get('/api/products?upc=3274080005003')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('brand');
    });

    it('should return 400 when no params provided', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toHaveProperty('code', 'INVALID_ARGUMENT');
    });
  });

  describe('GET /api/products/barcode/:code', () => {
    it('should return 200 with product data for valid barcode', async () => {
      const response = await request(app)
        .get('/api/products/barcode/3274080005003')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('brand');
      expect(response.body).toHaveProperty('barcode');
      expect(response.body.barcode.value).toBe('3274080005003');
    });

    it('should return 404 for non-existent barcode', async () => {
      const response = await request(app)
        .get('/api/products/barcode/0000000000000')
        .expect('Content-Type', /json/);

      // May return 404 or 500 depending on external API response
      expect([404, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });
  });
});

