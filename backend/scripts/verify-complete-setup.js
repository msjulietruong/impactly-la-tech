import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Updated brand mapping (same as what you should have in productController.js)
const COMPANY_BRAND_MAP = {
  'walmart': 'Walmart', 'great value': 'Walmart', "sam's choice": 'Walmart', 'marketside': 'Walmart', 'equate': 'Walmart',
  'kroger': 'Kroger', 'simple truth': 'Kroger', 'private selection': 'Kroger',
  'target': 'Target', 'good & gather': 'Target', 'market pantry': 'Target',
  'costco': 'Costco', 'kirkland signature': 'Costco', 'kirkland': 'Costco',
  'general mills': 'General Mills', 'cheerios': 'General Mills', 'nature valley': 'General Mills', 'yoplait': 'General Mills', 'lucky charms': 'General Mills', 'pillsbury': 'General Mills',
  'pepsi': 'PepsiCo', 'pepsico': 'PepsiCo', 'frito-lay': 'PepsiCo', "lay's": 'PepsiCo', 'lays': 'PepsiCo', 'doritos': 'PepsiCo', 'mountain dew': 'PepsiCo', 'gatorade': 'PepsiCo', 'quaker': 'PepsiCo',
  'coca-cola': 'Coca-Cola', 'coke': 'Coca-Cola', 'sprite': 'Coca-Cola', 'fanta': 'Coca-Cola',
  'campbell': 'Campbell', "campbell's": 'Campbell', 'pepperidge farm': 'Campbell', 'goldfish': 'Campbell',
  'mccormick': 'McCormick', 'french': 'McCormick', "french's": 'McCormick', 'lawry': 'McCormick', 'casero': 'McCormick',
  'hershey': 'Hershey', "hershey's": 'Hershey', 'reese': 'Hershey', 'jolly rancher': 'Hershey',
  'oreo': 'Mondelez', 'ritz': 'Mondelez', 'cadbury': 'Mondelez', 'trident': 'Mondelez',
  'mars': 'Mars', "m&m's": 'Mars', 'snickers': 'Mars', 'skittles': 'Mars', 'starburst': 'Mars',
  'conagra': 'ConAgra', 'hunt': 'ConAgra', "hunt's": 'ConAgra', 'healthy choice': 'ConAgra',
  'hormel': 'Hormel', 'spam': 'Hormel', 'skippy': 'Hormel',
  'tyson': 'Tyson', 'jimmy dean': 'Tyson', 'hillshire farm': 'Tyson',
  'gt': 'GT', 'kombucha': 'GT'
};

function getBrandCompanyName(brandName) {
  if (!brandName) return null;
  const normalized = brandName.toLowerCase().trim();
  return COMPANY_BRAND_MAP[normalized] || brandName;
}

const COMPANIES = [
  { name: 'General Mills', brands: /general mills|cheerios|nature valley|yoplait|lucky charms|pillsbury/i },
  { name: 'PepsiCo', brands: /pepsi|frito-lay|lay's|lays|doritos|mountain dew|gatorade|quaker/i },
  { name: 'Campbell', brands: /campbell|pepperidge farm|goldfish/i },
  { name: 'McCormick', brands: /mccormick|french|lawry|casero/i },
  { name: 'Walmart', brands: /great value|walmart|marketside/i },
  { name: 'Hershey', brands: /hershey|reese|jolly rancher/i },
  { name: 'Mondelez', brands: /oreo|ritz|cadbury|trident/i },
  { name: 'Mars', brands: /^mars$|m&m|snickers|skittles|starburst/i },
  { name: 'ConAgra', brands: /conagra|hunt|healthy choice/i },
  { name: 'Costco', brands: /kirkland|costco/i },
  { name: 'Hormel', brands: /hormel|spam|skippy/i },
  { name: 'Tyson', brands: /tyson|jimmy dean|hillshire/i },
  { name: 'Target', brands: /^target$|good & gather|market pantry/i },
  { name: 'Coca-Cola', brands: /coca-cola|^coke$|sprite|fanta/i },
  { name: 'GT', brands: /^gt$|kombucha/i }
];

async function verifySetup() {
  await mongoose.connect(process.env.MONGODB_URI);
  const foodCollection = mongoose.connection.db.collection('food');
  const esgCollection = mongoose.connection.db.collection('esg_scores');
  
  console.log('\n' + '═'.repeat(80));
  console.log('COMPLETE SETUP VERIFICATION');
  console.log('Checking: Products with Grades + ESG Mapping + Alternatives Ready');
  console.log('═'.repeat(80) + '\n');

  const results = [];

  for (const company of COMPANIES) {
    // Find products with grades and embeddings
    const products = await foodCollection.find({
      brands: company.brands,
      environmental_score_grade: { $nin: ['unknown', null, '', 'not-applicable', 'NOT-APPLICABLE'] },
      embedding: { $exists: true, $ne: [] }
    }).limit(10).toArray();
    
    if (products.length === 0) {
      console.log(`\n❌ ${company.name} - No graded products with embeddings`);
      continue;
    }

    // Check if brand maps to ESG company
    const sampleBrand = products[0].brands.split(',')[0].trim();
    const mappedCompany = getBrandCompanyName(sampleBrand);
    const cleanName = mappedCompany.split(',')[0].trim();
    
    const esgCompany = await esgCollection.findOne({
      name: { $regex: new RegExp(`^${cleanName}`, 'i') }
    });

    const hasESG = !!esgCompany;
    
    if (hasESG) {
      results.push({
        company: company.name,
        products: products.slice(0, 5),
        esgName: esgCompany.name,
        esgLevel: esgCompany.total_level
      });
      
      console.log(`\n✅ ${company.name} → ${esgCompany.name} (${esgCompany.total_level})`);
      console.log('─'.repeat(60));
      products.slice(0, 5).forEach((p, i) => {
        console.log(`   ${i+1}. ${p.product_name}`);
        console.log(`      Grade: ${p.environmental_score_grade.toUpperCase()} | Code: ${p.code}`);
      });
    } else {
      console.log(`\n⚠️  ${company.name} - Has products but brand mapping failed`);
      console.log(`   Sample brand: "${sampleBrand}" → maps to: "${mappedCompany}"`);
      console.log(`   ESG search result: NOT FOUND`);
    }
  }

  console.log('\n\n' + '═'.repeat(80));
  console.log(`✅ WORKING: ${results.length}/15 companies fully configured`);
  console.log('═'.repeat(80) + '\n');

  if (results.length > 0) {
    console.log('🎯 READY-TO-TEST PRODUCTS:\n');
    
    results.forEach(r => {
      const p = r.products[0];
      console.log(`# ${r.company} - ${p.product_name} (Grade ${p.environmental_score_grade.toUpperCase()})`);
      console.log(`curl -s "http://localhost:3001/api/products/${p.code}/alternatives?limit=5" | jq '{product: .productName, grade: .environmental_score_grade, company: .company_esg.company_name, esg_level: .company_esg.total_level, alt_count: .count}'\n`);
    });
  }

  await mongoose.disconnect();
  console.log('✅ Done\n');
}

verifySetup().catch(console.error);