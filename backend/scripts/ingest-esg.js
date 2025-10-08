require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const mongoose = require('mongoose');
const Company = require('../models/Company');

// Helper function to extract registrable domain from URL
function registrableDomainFrom(url) {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (error) {
    return null;
  }
}

// Helper function to convert to number or null
function num(value) {
  if (!value || value === '' || value === 'null') return null;
  const parsed = Number(value);
  return isNaN(parsed) ? null : parsed;
}

// Helper function to convert date to ISO string
function iso(dateStr) {
  if (!dateStr || dateStr === '' || dateStr === 'null') return null;
  
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch (error) {
    return null;
  }
}

// Helper function to union and dedupe arrays
function unionDedupe(...arrays) {
  const set = new Set();
  arrays.forEach(arr => {
    if (Array.isArray(arr)) {
      arr.forEach(item => {
        if (item && typeof item === 'string') {
          set.add(item.trim());
        }
      });
    }
  });
  return Array.from(set);
}

async function ingestESGData() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ethical-product-finder';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const csvPath = path.join(__dirname, '..', 'data', 'dataset.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    const stats = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      skippedReasons: []
    };

    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const records = [];
    
    // Read and parse CSV
    fs.createReadStream(csvPath)
      .pipe(parser)
      .on('data', (row) => {
        records.push(row);
      })
      .on('error', (error) => {
        throw error;
      })
      .on('end', async () => {
        console.log(`Processing ${records.length} records...`);
        
        for (const row of records) {
          try {
            // Validate required fields
            if (!row.ticker || !row.ticker.trim()) {
              stats.skipped++;
              const reason = `Missing ticker: ${JSON.stringify(row.ticker)}`;
              if (stats.skippedReasons.length < 3) {
                stats.skippedReasons.push(reason);
              }
              continue;
            }

            // Parse ESG scores
            let E = num(row.environment_score);
            let S = num(row.social_score);
            let G = num(row.governance_score);

            // Normalize scores to 0-100 scale if they're on a different scale
            // If any score is > 100, assume the scale is higher and normalize
            const maxScore = Math.max(E || 0, S || 0, G || 0);
            if (maxScore > 100) {
              const scaleFactor = 100 / maxScore;
              if (E !== null) E = Math.round(E * scaleFactor);
              if (S !== null) S = Math.round(S * scaleFactor);
              if (G !== null) G = Math.round(G * scaleFactor);
              console.log(`Normalized scores for ${row.ticker}: E=${E}, S=${S}, G=${G} (scale factor: ${scaleFactor.toFixed(3)})`);
            }

            // Skip if all ESG scores are null
            if (E === null && S === null && G === null) {
              stats.skipped++;
              const reason = `All ESG scores null for ticker: ${row.ticker}`;
              if (stats.skippedReasons.length < 3) {
                stats.skippedReasons.push(reason);
              }
              continue;
            }

            // Build document
            const ticker = row.ticker.toUpperCase().trim();
            const asOf = iso(row.last_processing_date);
            
            const doc = {
              name: row.name || 'Unknown Company',
              aliases: [row.name || 'Unknown Company'],
              tickers: [ticker],
              country: null,
              domains: row.weburl ? [registrableDomainFrom(row.weburl)].filter(Boolean) : [],
              esgSources: [{
                source: "kaggle-public-company-esg",
                asOf: asOf || new Date().toISOString(),
                raw: {
                  E,
                  S,
                  G,
                  scale: "0-100"
                }
              }]
            };

            // Find existing company by ticker (case-insensitive)
            const existing = await Company.findOne({ 
              tickers: { $regex: new RegExp(`^${ticker}$`, 'i') }
            });

            if (existing) {
              // Update existing company
              const updateDoc = {
                $addToSet: {
                  aliases: { $each: doc.aliases },
                  tickers: { $each: doc.tickers },
                  domains: { $each: doc.domains }
                }
              };

              // Only add new ESG source if it's newer than existing ones
              const latestExistingAsOf = existing.esgSources.length > 0 
                ? existing.esgSources.reduce((latest, source) => {
                    return source.asOf > latest ? source.asOf : latest;
                  }, '')
                : '';

              if (asOf && asOf > latestExistingAsOf) {
                updateDoc.$push = {
                  esgSources: doc.esgSources[0]
                };
              }

              await Company.findOneAndUpdate(
                { _id: existing._id },
                updateDoc,
                { upsert: false }
              );
              stats.updated++;
            } else {
              // Insert new company
              await Company.create(doc);
              stats.inserted++;
            }

          } catch (error) {
            stats.skipped++;
            const reason = `Error processing ticker ${row.ticker}: ${error.message}`;
            if (stats.skippedReasons.length < 3) {
              stats.skippedReasons.push(reason);
            }
            console.error(`Error processing row:`, error);
          }
        }

        // Log summary
        console.log('\n=== Ingestion Summary ===');
        console.log(`Inserted: ${stats.inserted}`);
        console.log(`Updated: ${stats.updated}`);
        console.log(`Skipped: ${stats.skipped}`);
        console.log(`First 3 skipped reasons:`, stats.skippedReasons);

        // Close connection
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
        process.exit(0);

      });

  } catch (error) {
    console.error('Ingestion failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, closing gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, closing gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Start ingestion
ingestESGData();
