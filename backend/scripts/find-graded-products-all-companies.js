import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const COMPANIES_WITH_ESG = [
  { name: 'General Mills', brands: /general mills|cheerios|nature valley|yoplait|lucky charms|pillsbury|haagen-dazs|betty crocker/i },
  { name: 'PepsiCo', brands: /pepsi|frito-lay|lay's|lays|doritos|mountain dew|gatorade|tropicana|quaker|tostitos|cheetos|ruffles/i },
  { name: 'Campbell', brands: /campbell|pepperidge farm|goldfish|v8|prego|swanson/i },
  { name: 'McCormick', brands: /mccormick|french|old bay|lawry/i },
  { name: 'Walmart', brands: /great value|walmart|marketside|sam's choice|equate/i },
  { name: 'Hershey', brands: /hershey|reese|kit kat|kisses|jolly rancher/i },
  { name: 'Mondelez', brands: /oreo|cadbury|ritz|trident|chips ahoy|wheat thins|triscuit/i },
  { name: 'Mars', brands: /mars|m&m|snickers|twix|milky way|skittles|starburst/i },
  { name: 'ConAgra', brands: /conagra|hunt|reddi-wip|slim jim|healthy choice|marie callender|orville redenbacher/i },
  { name: 'Costco', brands: /kirkland signature|kirkland|costco/i },
  { name: 'Hormel', brands: /hormel|spam|skippy|jennie-o|applegate/i },
  { name: 'Tyson', brands: /tyson|jimmy dean|hillshire farm|ball park/i },
  { name: 'Target', brands: /target|good & gather|market pantry|favorite day/i },
  { name: 'Coca-Cola', brands: /coca-cola|coke|sprite|fanta|dasani|minute maid|powerade|vitaminwater/i },
  { name: 'GT', brands: /gt|kombucha/i }
];

async function findGradedProducts() {
  await mongoose.connect(process.env.MONGODB_URI);
  const foodCollection = mongoose.connection.db.collection('food');
  
  console.log('\n' + '═'.repeat(80));
  console.log('FINDING PRODUCTS WITH ENVIRONMENTAL GRADES');
  console.log('═'.repeat(80) + '\n');

  const results = [];

  for (const company of COMPANIES_WITH_ESG) {
    // Find products with actual grades (not unknown)
    const products = await foodCollection.find({
      brands: company.brands,
      environmental_score_grade: { $nin: ['unknown', null, ''] },
      embedding: { $exists: true, $ne: [] }
    }).limit(5).toArray();
    
    if (products.length > 0) {
      results.push({ company: company.name, products, count: products.length });
      
      console.log(`\n✅ ${company.name}`);
      console.log('─'.repeat(60));
      
      products.forEach((p, i) => {
        console.log(`   ${i+1}. ${p.product_name}`);
        console.log(`      Grade: ${p.environmental_score_grade.toUpperCase()} | Code: ${p.code}`);
      });
    } else {
      console.log(`\n❌ ${company.name} - No products with grades found`);
    }
  }

  console.log('\n\n' + '═'.repeat(80));
  console.log('SUMMARY & TEST COMMANDS');
  console.log('═'.repeat(80) + '\n');

  console.log(`Found graded products from ${results.length} companies:\n`);

  results.forEach(r => {
    console.log(`${r.company}: ${r.count} products with grades`);
  });

  if (results.length > 0) {
    console.log('\n\n💡 QUICK TEST - Pick any product code and try:\n');
    
    // Show example from first company
    const example = results[0].products[0];
    console.log(`# Example: ${example.product_name} (${results[0].company})`);
    console.log(`# Grade: ${example.environmental_score_grade.toUpperCase()}\n`);
    console.log(`curl "http://localhost:3001/api/products/${example.code}/alternatives?limit=5"`);
    
    console.log('\n\n📋 ALL TEST COMMANDS:\n');
    results.forEach(r => {
      console.log(`# ${r.company}`);
      r.products.slice(0, 3).forEach(p => {
        console.log(`curl "http://localhost:3001/api/products/${p.code}/alternatives?limit=5"  # ${p.product_name} (${p.environmental_score_grade.toUpperCase()})`);
      });
      console.log();
    });
  } else {
    console.log('\n❌ No products found with environmental grades');
  }

  await mongoose.disconnect();
  console.log('✅ Done\n');
}

findGradedProducts().catch(console.error);