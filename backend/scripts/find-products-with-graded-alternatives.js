import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const COMPANY_BRAND_MAP = {
  'walmart': 'Walmart', 'great value': 'Walmart', "sam's choice": 'Walmart', 'marketside': 'Walmart',
  'general mills': 'General Mills', 'cheerios': 'General Mills', 'nature valley': 'General Mills', 'yoplait': 'General Mills',
  'pepsi': 'PepsiCo', 'pepsico': 'PepsiCo', 'doritos': 'PepsiCo', 'lays': 'PepsiCo', "lay's": 'PepsiCo', 'quaker': 'PepsiCo',
  'campbell': 'Campbell', 'pepperidge farm': 'Campbell', 'goldfish': 'Campbell',
  'mccormick': 'McCormick', 'french': 'McCormick', 'lawry': 'McCormick', 'casero': 'McCormick',
  'hershey': 'Hershey', "hershey's": 'Hershey', 'reese': 'Hershey', 'jolly rancher': 'Hershey',
  'oreo': 'Mondelez', 'ritz': 'Mondelez', 'cadbury': 'Mondelez',
  'mars': 'Mars', "m&m's": 'Mars', 'snickers': 'Mars', 'skittles': 'Mars', 'starburst': 'Mars',
  'conagra': 'ConAgra', 'hunt': 'ConAgra', 'healthy choice': 'ConAgra',
  'costco': 'Costco', 'kirkland': 'Costco', 'kirkland signature': 'Costco',
  'hormel': 'Hormel', 'skippy': 'Hormel',
  'tyson': 'Tyson', 'jimmy dean': 'Tyson',
  'target': 'Target', 'good & gather': 'Target',
  'coca-cola': 'Coca-Cola', 'sprite': 'Coca-Cola',
  'gt': 'GT', 'kombucha': 'GT'
};

function getBrandCompanyName(brandName) {
  if (!brandName) return null;
  const normalized = brandName.toLowerCase().trim();
  return COMPANY_BRAND_MAP[normalized] || brandName;
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

const COMPANIES = [
  { name: 'General Mills', brands: /general mills|cheerios|nature valley|yoplait/i },
  { name: 'PepsiCo', brands: /pepsi|doritos|lay's|lays|quaker/i },
  { name: 'Campbell', brands: /campbell|pepperidge farm|goldfish/i },
  { name: 'McCormick', brands: /mccormick|french|lawry|casero/i },
  { name: 'Walmart', brands: /great value|walmart/i },
  { name: 'Hershey', brands: /hershey|reese|jolly rancher/i },
  { name: 'Mondelez', brands: /oreo|ritz/i },
  { name: 'Mars', brands: /^mars$|m&m|snickers|skittles/i },
  { name: 'ConAgra', brands: /conagra|hunt|healthy choice/i },
  { name: 'Costco', brands: /kirkland/i },
  { name: 'Hormel', brands: /hormel|skippy/i },
  { name: 'Tyson', brands: /tyson|jimmy dean/i },
  { name: 'Target', brands: /^target$|good & gather/i },
  { name: 'Coca-Cola', brands: /coca-cola|sprite/i },
  { name: 'GT', brands: /^gt$|kombucha/i }
];

async function findProductsWithGradedAlternatives() {
  await mongoose.connect(process.env.MONGODB_URI);
  const foodCollection = mongoose.connection.db.collection('food');
  const esgCollection = mongoose.connection.db.collection('esg_scores');
  
  console.log('\n' + '═'.repeat(80));
  console.log('FINDING PRODUCTS WITH GRADED ALTERNATIVES');
  console.log('(Products where alternatives also have environmental grades)');
  console.log('═'.repeat(80) + '\n');

  const GRADE_SCORES = { 'a': 5, 'b': 4, 'c': 3, 'd': 2, 'e': 1 };
  const goodProducts = [];

  for (const company of COMPANIES) {
    const products = await foodCollection.find({
      brands: company.brands,
      environmental_score_grade: { $nin: ['unknown', null, '', 'not-applicable', 'NOT-APPLICABLE'] },
      embedding: { $exists: true, $ne: [] }
    }).limit(20).toArray();
    
    if (products.length === 0) continue;

    // Check ESG mapping
    const sampleBrand = products[0].brands.split(',')[0].trim();
    const mappedCompany = getBrandCompanyName(sampleBrand);
    const cleanName = mappedCompany.split(',')[0].trim();
    const esgCompany = await esgCollection.findOne({
      name: { $regex: new RegExp(`^${cleanName}`, 'i') }
    });

    if (!esgCompany) continue;

    // Test each product for graded alternatives
    for (const product of products) {
      const originalGrade = String(product.environmental_score_grade || '').toLowerCase();
      const originalScore = GRADE_SCORES[originalGrade] || 0;
      if (originalScore === 0) continue;

      // Get categories
      const categories = product.categories ? product.categories.split(',').map(c => c.trim()) : [];
      const specificCategory = categories.length > 0 ? categories[categories.length - 1] : '';

      // Find candidates
      const query = {
        _id: { $ne: product._id },
        embedding: { $exists: true, $ne: [] }
      };
      
      if (specificCategory) {
        query.categories = { $regex: specificCategory, $options: 'i' };
      }

      const candidates = await foodCollection.find(query).limit(100).toArray();

      // Find better graded alternatives
      const alternatives = [];
      for (const candidate of candidates) {
        const similarity = cosineSimilarity(product.embedding, candidate.embedding);
        
        if (similarity > 0.75) {
          const candidateGrade = String(candidate.environmental_score_grade || '').toLowerCase();
          const candidateScore = GRADE_SCORES[candidateGrade] || 0;
          
          if (candidateScore > 0 && candidateScore > originalScore) {
            alternatives.push({
              name: candidate.product_name,
              grade: candidateGrade,
              similarity: similarity
            });
          }
        }
      }

      if (alternatives.length > 0) {
        goodProducts.push({
          company: company.name,
          esgName: esgCompany.name,
          esgLevel: esgCompany.total_level,
          product: product,
          alternativesCount: alternatives.length,
          topAlternatives: alternatives.slice(0, 3)
        });
      }
    }
  }

  console.log(`✅ Found ${goodProducts.length} products with graded alternatives:\n`);

  // Group by company
  const byCompany = {};
  goodProducts.forEach(p => {
    if (!byCompany[p.company]) byCompany[p.company] = [];
    byCompany[p.company].push(p);
  });

  Object.entries(byCompany).forEach(([companyName, products]) => {
    console.log(`\n${companyName} (${products.length} products)`);
    console.log('─'.repeat(60));
    
    products.slice(0, 3).forEach((item, i) => {
      const p = item.product;
      console.log(`   ${i+1}. ${p.product_name}`);
      console.log(`      Grade: ${p.environmental_score_grade.toUpperCase()} | Code: ${p.code}`);
      console.log(`      Alternatives: ${item.alternativesCount} graded alternatives found`);
      item.topAlternatives.forEach(alt => {
        console.log(`         - ${alt.name} (${alt.grade.toUpperCase()}, ${Math.round(alt.similarity * 100)}% similar)`);
      });
    });
  });

  if (goodProducts.length > 0) {
    console.log('\n\n' + '═'.repeat(80));
    console.log('🎯 TEST THESE PRODUCTS');
    console.log('═'.repeat(80) + '\n');

    Object.entries(byCompany).forEach(([companyName, products]) => {
      const item = products[0];
      const p = item.product;
      console.log(`# ${companyName} - ${p.product_name} (${p.environmental_score_grade.toUpperCase()} → has ${item.alternativesCount} graded alternatives)`);
      console.log(`curl -s "http://localhost:3001/api/products/${p.code}/alternatives?limit=5" | jq\n`);
    });
  }

  await mongoose.disconnect();
  console.log('✅ Done\n');
}

findProductsWithGradedAlternatives().catch(console.error);