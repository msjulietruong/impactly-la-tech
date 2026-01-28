import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Brand to company mapping (same as in your controller)
const COMPANY_BRAND_MAP = {
  'walmart': 'Walmart',
  'great value': 'Walmart',
  "sam's choice": 'Walmart',
  'marketside': 'Walmart',
  'equate': 'Walmart',
  'kroger': 'Kroger',
  'simple truth': 'Kroger',
  'private selection': 'Kroger',
  'target': 'Target',
  'good & gather': 'Target',
  'market pantry': 'Target',
  'costco': 'Costco',
  'kirkland signature': 'Costco',
  'general mills': 'General Mills',
  'cheerios': 'General Mills',
  'nature valley': 'General Mills',
  'yoplait': 'General Mills',
  'pepsi': 'PepsiCo',
  'pepsico': 'PepsiCo',
  'doritos': 'PepsiCo',
  'lays': 'PepsiCo',
  "lay's": 'PepsiCo',
  'coca-cola': 'Coca-Cola',
  'coke': 'Coca-Cola',
  'sprite': 'Coca-Cola',
  'oreo': 'Mondelez',
  'ritz': 'Mondelez',
  'cadbury': 'Mondelez',
  'mars': 'Mars',
  'snickers': 'Mars',
  'skittles': 'Mars',
  'campbell': 'Campbell',
  'pepperidge farm': 'Campbell',
  'hershey': 'Hershey',
  'reese': 'Hershey',
  'mccormick': 'McCormick',
  'conagra': 'ConAgra',
  'tyson': 'Tyson',
  'hormel': 'Hormel',
  'skippy': 'Hormel'
};

function getBrandCompanyName(brandName) {
  if (!brandName) return null;
  const normalized = brandName.toLowerCase().trim();
  return COMPANY_BRAND_MAP[normalized] || brandName;
}

async function findCompleteProducts() {
  await mongoose.connect(process.env.MONGODB_URI);
  const foodCollection = mongoose.connection.db.collection('food');
  const esgCollection = mongoose.connection.db.collection('esg_scores');
  
  console.log('\n' + '═'.repeat(80));
  console.log('FINDING COMPLETE TEST PRODUCTS');
  console.log('(Products with: Grade + ESG + Alternatives)');
  console.log('═'.repeat(80) + '\n');

  // Get all products with grades and embeddings
  const products = await foodCollection.find({
    environmental_score_grade: { $nin: ['unknown', null, ''] },
    embedding: { $exists: true, $ne: [] }
  }).limit(100).toArray();

  const completeProducts = [];

  for (const product of products) {
    if (!product.brands) continue;
    
    // Check if brand maps to a company with ESG data
    const companyName = getBrandCompanyName(product.brands.split(',')[0].trim());
    const cleanName = companyName.split(',')[0].trim();
    
    const company = await esgCollection.findOne({
      name: { $regex: new RegExp(`^${cleanName}`, 'i') }
    });
    
    if (company) {
      completeProducts.push({
        product,
        companyName: company.name,
        esgLevel: company.total_level
      });
    }
  }

  console.log(`✅ Found ${completeProducts.length} complete products:\n`);

  completeProducts.slice(0, 20).forEach((item, i) => {
    const p = item.product;
    console.log(`${i+1}. ${p.product_name}`);
    console.log(`   Brand: ${p.brands}`);
    console.log(`   Company: ${item.companyName} (ESG: ${item.esgLevel})`);
    console.log(`   Grade: ${p.environmental_score_grade.toUpperCase()}`);
    console.log(`   Code: ${p.code}`);
    console.log();
  });

  if (completeProducts.length > 0) {
    console.log('\n' + '═'.repeat(80));
    console.log('RECOMMENDED TEST PRODUCTS');
    console.log('═'.repeat(80) + '\n');

    // Show best examples
    const best = completeProducts.slice(0, 5);
    best.forEach((item, i) => {
      const p = item.product;
      console.log(`${i+1}. ${p.product_name} (${item.companyName})`);
      console.log(`   Grade: ${p.environmental_score_grade.toUpperCase()} | ESG: ${item.esgLevel}`);
      console.log(`   curl "http://localhost:3001/api/products/${p.code}/alternatives?limit=5"`);
      console.log();
    });

    console.log('\n💡 FORMATTED OUTPUT (with jq):\n');
    const example = completeProducts[0].product;
    console.log(`curl -s "http://localhost:3001/api/products/${example.code}/alternatives?limit=5" | jq '{`);
    console.log(`  product: .productName,`);
    console.log(`  grade: .environmental_score_grade,`);
    console.log(`  company: .company_esg.company_name,`);
    console.log(`  esg_level: .company_esg.total_level,`);
    console.log(`  alternatives_count: .count,`);
    console.log(`  alternatives: .alternatives | map({name: .product_name, grade: .environmental_score_grade, company: .company_esg.company_name})`);
    console.log(`}'`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Done\n');
}

findCompleteProducts().catch(console.error);