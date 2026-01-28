// Save as: check-common-brands.js
// Run: node check-common-brands.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const COMMON_BRANDS = [
  // Major Food Conglomerates
  { company: 'Coca-Cola', brands: ['coca-cola', 'coke', 'sprite', 'fanta', 'dasani', 'minute maid', 'powerade', 'vitaminwater'] },
  { company: 'PepsiCo', brands: ['pepsi', 'frito-lay', "lay's", 'doritos', 'mountain dew', 'gatorade', 'tropicana', 'quaker', 'tostitos', 'cheetos', 'ruffles'] },
  { company: 'Nestlé', brands: ['nestle', 'nescafe', 'kit kat', 'pure life', 'gerber', 'stouffer', 'digiorno', 'hot pockets', 'lean cuisine', 'butterfinger', 'crunch'] },
  { company: 'Unilever', brands: ['unilever', "ben & jerry's", "hellmann's", 'knorr', 'lipton', 'dove', 'breyers', 'magnum', 'klondike'] },
  { company: 'Danone', brands: ['dannon', 'danone', 'evian', 'oikos', 'activia', 'light & fit', 'horizon organic'] },
  { company: 'Kraft Heinz', brands: ['kraft', 'heinz', 'oscar mayer', 'philadelphia', 'velveeta', 'capri sun', 'jell-o', 'maxwell house', 'planters', 'lunchables', 'kool-aid'] },
  { company: 'General Mills', brands: ['general mills', 'cheerios', 'nature valley', 'yoplait', 'lucky charms', 'pillsbury', 'haagen-dazs', 'betty crocker', 'old el paso', 'totino'] },
  { company: "Kellogg's", brands: ['kelloggs', "kellogg's", 'pringles', 'cheez-it', 'frosted flakes', 'special k', 'pop-tarts', 'rice krispies', 'eggo', 'nutri-grain'] },
  { company: 'Mars', brands: ['mars', "m&m's", 'snickers', 'twix', 'pedigree', 'milky way', 'dove chocolate', 'skittles', 'starburst', 'uncle ben'] },
  { company: 'Mondelez', brands: ['oreo', 'cadbury', 'ritz', 'trident', 'chips ahoy', 'wheat thins', 'triscuit', 'sour patch kids', 'toblerone'] },
  
  // Store Brands
  { company: 'Walmart', brands: ['great value', 'walmart', 'marketside', "sam's choice", 'equate'] },
  { company: 'Kroger', brands: ['kroger', 'simple truth', 'private selection'] },
  { company: 'Target', brands: ['target', 'good & gather', 'market pantry', 'favorite day'] },
  { company: 'Costco', brands: ['kirkland signature', 'kirkland', 'costco'] },
  { company: 'Whole Foods', brands: ['365', 'whole foods', '365 everyday value'] },
  { company: 'Trader Joe', brands: ["trader joe's", 'trader joes'] },
  
  // Other Major Brands
  { company: 'Campbell', brands: ['campbell', "campbell's", 'pepperidge farm', 'goldfish', 'v8', 'prego', 'swanson'] },
  { company: 'ConAgra', brands: ['conagra', 'hunt', "hunt's", 'reddi-wip', 'slim jim', 'healthy choice', 'marie callender', 'orville redenbacher', 'swiss miss', 'vlasic'] },
  { company: 'Ferrero', brands: ['ferrero', 'nutella', 'ferrero rocher', 'tic tac', 'kinder'] },
  { company: 'Hershey', brands: ['hershey', "hershey's", 'reese', "reese's", 'kit kat', 'kisses', 'jolly rancher', 'ice breakers'] },
  { company: 'Hormel', brands: ['hormel', 'spam', 'skippy', 'jennie-o', 'applegate'] },
  { company: 'Tyson', brands: ['tyson', 'jimmy dean', 'hillshire farm', 'ball park'] },
  { company: 'Barilla', brands: ['barilla'] },
  { company: 'McCormick', brands: ['mccormick', 'french', "french's", 'old bay', 'lawry'] },
  { company: 'Post', brands: ['post', 'honey bunches', 'pebbles', 'grape nuts'] },
  { company: 'Chobani', brands: ['chobani'] },
  { company: 'Del Monte', brands: ['del monte'] },
  { company: 'Dole', brands: ['dole'] },
  { company: 'Blue Diamond', brands: ['blue diamond'] },
  { company: 'Clif Bar', brands: ['clif', 'clif bar', 'luna'] },
  { company: 'Kind', brands: ['kind', 'kind bar'] },
  { company: 'Annie', brands: ['annie', "annie's"] },
  { company: 'Amy', brands: ['amy', "amy's kitchen"] },
  { company: 'Bimbo', brands: ['bimbo', 'thomas', "thomas'", 'sara lee', 'entenmann', "entenmann's", 'arnold'] },
  { company: 'Dean Foods', brands: ['dean', 'land o lakes'] },
  { company: 'Driscoll', brands: ['driscoll', "driscoll's"] },
  { company: 'Fage', brands: ['fage'] },
  { company: 'GT', brands: ['gt', "gt's", 'kombucha'] },
  { company: 'Kashi', brands: ['kashi'] },
  { company: 'Kodiak', brands: ['kodiak'] },
  { company: 'Lactalis', brands: ['president', 'galbani'] },
  { company: 'Nature Valley', brands: ['nature valley'] },
  { company: 'Ocean Spray', brands: ['ocean spray'] },
  { company: 'Red Bull', brands: ['red bull'] },
  { company: 'Sabra', brands: ['sabra'] },
  { company: 'Smucker', brands: ['smucker', "smucker's", 'jif', 'folgers', 'dunkin'] },
  { company: 'Snyder', brands: ['snyder', "snyder's", 'pretzel'] },
  { company: 'Tree Top', brands: ['tree top'] },
  { company: 'Welch', brands: ['welch', "welch's"] }
];

async function checkCommonBrands() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const foodCollection = mongoose.connection.db.collection('food');
  const esgCollection = mongoose.connection.db.collection('esg_scores');

  console.log('\n' + '═'.repeat(80));
  console.log('CHECKING COMMON FOOD BRANDS IN YOUR DATABASE');
  console.log('═'.repeat(80) + '\n');

  let bestMatch = null;
  let bestScore = 0;
  const completeMatches = [];

  for (const item of COMMON_BRANDS) {
    console.log(`\n📦 ${item.company}`);
    console.log('─'.repeat(60));
    
    // Check ESG company
    const company = await esgCollection.findOne({
      name: { $regex: new RegExp(item.company, 'i') }
    });
    
    const hasESG = company ? '✅' : '❌';
    console.log(`   ESG Data: ${hasESG} ${company ? `(Total Level: ${company.total_level || 'N/A'})` : ''}`);
    
    // Check products for each brand
    let totalProducts = 0;
    const foundBrands = [];
    
    for (const brand of item.brands) {
      const count = await foodCollection.countDocuments({
        brands: { $regex: new RegExp(brand, 'i') }
      });
      
      if (count > 0) {
        totalProducts += count;
        foundBrands.push({ brand, count });
      }
    }
    
    if (totalProducts > 0) {
      console.log(`   Products: ✅ (${totalProducts} total)`);
      foundBrands.slice(0, 3).forEach(fb => {
        console.log(`      • ${fb.brand}: ${fb.count}`);
      });
      if (foundBrands.length > 3) {
        console.log(`      ... and ${foundBrands.length - 3} more brands`);
      }
    } else {
      console.log(`   Products: ❌ (0 found)`);
    }
    
    // Calculate match score
    const score = (company ? 50 : 0) + (totalProducts > 0 ? 50 : 0);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { 
        company: item.company, 
        hasESG: !!company, 
        productCount: totalProducts,
        totalLevel: company?.total_level
      };
    }
    
    // Show verdict
    if (company && totalProducts > 0) {
      console.log(`   ✅ COMPLETE - Has both ESG data and products!`);
      completeMatches.push({
        company: item.company,
        products: totalProducts,
        level: company.total_level
      });
    } else if (company) {
      console.log(`   ⚠️  Has ESG but no products in your food DB`);
    } else if (totalProducts > 0) {
      console.log(`   ⚠️  Has products but no ESG data`);
    }
  }

  // Show all complete matches
  console.log('\n\n' + '═'.repeat(80));
  console.log('COMPLETE MATCHES (ESG + Products)');
  console.log('═'.repeat(80));
  
  if (completeMatches.length > 0) {
    console.log(`\n✅ Found ${completeMatches.length} brands with both ESG data and products:\n`);
    completeMatches
      .sort((a, b) => b.products - a.products)
      .forEach((match, i) => {
        console.log(`   ${i+1}. ${match.company}`);
        console.log(`      • Products: ${match.products}`);
        console.log(`      • ESG Level: ${match.level || 'N/A'}`);
      });
    console.log(`\n💡 These are all good for testing your alternatives feature!`);
  } else {
    console.log('\n❌ No brands found with both ESG and products');
  }

  // Show what you DO have
  console.log('\n\n' + '═'.repeat(80));
  console.log('DATABASE SUMMARY');
  console.log('═'.repeat(80));
  
  const totalCompanies = await esgCollection.countDocuments();
  const totalProducts = await foodCollection.countDocuments();
  const productsWithGrades = await foodCollection.countDocuments({
    environmental_score_grade: { $nin: ['unknown', null, ''] }
  });
  const productsWithEmbeddings = await foodCollection.countDocuments({
    embedding: { $exists: true, $ne: [] }
  });
  
  console.log(`\n📊 Companies with ESG: ${totalCompanies}`);
  console.log(`📦 Total Products: ${totalProducts}`);
  console.log(`🌱 Products with environmental grades: ${productsWithGrades}`);
  console.log(`🤖 Products with embeddings: ${productsWithEmbeddings}`);
  
  if (totalCompanies > 0) {
    const sampleCompanies = await esgCollection.find().limit(5).toArray();
    console.log('\nSample companies with ESG data:');
    sampleCompanies.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.name} (${c.total_level || 'N/A'})`);
    });
  }
  
  if (totalProducts > 0) {
    const topBrands = await foodCollection.aggregate([
      { $match: { brands: { $ne: null, $ne: '' } } },
      { $group: { _id: '$brands', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    console.log('\nTop 10 brands by product count:');
    topBrands.forEach((b, i) => {
      console.log(`   ${i+1}. ${b._id} (${b.count} products)`);
    });
  }

  await mongoose.disconnect();
  console.log('\n✅ Done\n');
}

checkCommonBrands().catch(console.error);