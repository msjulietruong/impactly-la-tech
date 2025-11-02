/**
 * Test script to verify endpoints are working with database
 */
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 3001}`;

async function testEndpoints() {
  console.log('🧪 Testing Backend Endpoints\n');
  console.log(`📍 Testing against: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  // Test 1: Text search for "chocolate"
  console.log('Test 1: Text search for "chocolate"');
  try {
    const response = await axios.get(`${BASE_URL}/api/products?q=chocolate`);
    const products = Array.isArray(response.data) ? response.data : [response.data];
    
    if (products.length === 0) {
      console.log('  ❌ No products returned');
      failed++;
    } else {
      console.log(`  ✅ Found ${products.length} product(s)`);
      console.log(`  Sample: ${products[0].name} (${products[0].brand})`);
      
      // Check if ESG data is included
      if (products[0].esg !== undefined) {
        console.log(`  ✅ ESG data included: ${products[0].esg ? 'Yes' : 'No data available'}`);
      } else {
        console.log('  ⚠️  ESG data not included');
      }
      passed++;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.response?.data?.error?.message || error.message}`);
    failed++;
  }

  console.log('');

  // Test 2: Text search for "bottle"
  console.log('Test 2: Text search for "bottle"');
  try {
    const response = await axios.get(`${BASE_URL}/api/products?q=bottle`);
    const products = Array.isArray(response.data) ? response.data : [response.data];
    
    if (products.length === 0) {
      console.log('  ❌ No products returned');
      failed++;
    } else {
      console.log(`  ✅ Found ${products.length} product(s)`);
      products.slice(0, 3).forEach((p, i) => {
        console.log(`    ${i + 1}. ${p.name} (${p.brand})`);
      });
      passed++;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.response?.data?.error?.message || error.message}`);
    failed++;
  }

  console.log('');

  // Test 3: Text search for "ffd"
  console.log('Test 3: Text search for "ffd"');
  try {
    const response = await axios.get(`${BASE_URL}/api/products?q=ffd`);
    const products = Array.isArray(response.data) ? response.data : [response.data];
    
    if (products.length === 0) {
      console.log('  ⚠️  No products found (this might be expected)');
    } else {
      console.log(`  ✅ Found ${products.length} product(s)`);
      products.slice(0, 5).forEach((p, i) => {
        console.log(`    ${i + 1}. ${p.name} (${p.brand})`);
      });
    }
    passed++;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('  ✅ Correctly returned 404 (no products found)');
      passed++;
    } else {
      console.log(`  ❌ Error: ${error.response?.data?.error?.message || error.message}`);
      failed++;
    }
  }

  console.log('');

  // Test 4: Check database directly
  console.log('Test 4: Checking database directly');
  try {
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect(process.env.MONGODB_URI);
    
    const foodCollection = mongoose.connection.db.collection('food');
    const totalProducts = await foodCollection.countDocuments();
    console.log(`  ✅ Total products in database: ${totalProducts}`);
    
    // Check for products with "chocolate" in name
    const chocolateProducts = await foodCollection.countDocuments({
      $or: [
        { product_name: { $regex: 'chocolate', $options: 'i' } },
        { brands: { $regex: 'chocolate', $options: 'i' } },
        { categories: { $regex: 'chocolate', $options: 'i' } }
      ]
    });
    console.log(`  ✅ Products matching "chocolate": ${chocolateProducts}`);
    
    // Check for products with "bottle" in name
    const bottleProducts = await foodCollection.countDocuments({
      $or: [
        { product_name: { $regex: 'bottle', $options: 'i' } },
        { brands: { $regex: 'bottle', $options: 'i' } },
        { categories: { $regex: 'bottle', $options: 'i' } }
      ]
    });
    console.log(`  ✅ Products matching "bottle": ${bottleProducts}`);
    
    await mongoose.disconnect();
    passed++;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    failed++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

// Wait a bit for server to be ready, then test
setTimeout(() => {
  testEndpoints().catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });
}, 2000);

