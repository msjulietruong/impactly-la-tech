/**
 * ========================================
 * ESG DATA INGESTION SCRIPT
 * ========================================
 * 
 * What this does:
 * - Reads a CSV file containing company ESG data
 * - Imports all the data into our MongoDB database
 * - Updates existing companies or creates new ones
 * 
 * What is ingestion?
 * - "Ingestion" = importing/loading data into a system
 * - Like eating food → your body "ingests" it
 * - Here we're importing data → MongoDB "ingests" it
 * 
 * How to use:
 * 1. Put your CSV file in backend/data/dataset.csv
 * 2. Run: npm run ingest:esg
 * 3. Wait for it to finish
 * 4. Check the summary at the end
 * 
 * CSV should have columns like:
 * - ticker, name, environment_score, social_score, governance_score, etc.
 */

// Load environment variables from .env file
require('dotenv').config();

// Import tools we need
const fs = require('fs');               // Tool for reading files
const path = require('path');           // Tool for working with file paths
const { parse } = require('csv-parse'); // Tool for parsing CSV files
const mongoose = require('mongoose');   // Tool for talking to MongoDB
const Company = require('../models/Company');  // Our Company database model

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
// These small functions help us clean and process the CSV data

/**
 * HELPER: Extract domain from URL
 * 
 * What it does:
 * - Takes a URL like "https://www.microsoft.com/about"
 * - Returns just the domain "microsoft.com"
 * 
 * Why?
 * - We only want to store the main domain, not the full URL
 * - Removes "www." prefix to keep it clean
 */
function registrableDomainFrom(url) {
  // If URL is empty or not a string, return null
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Add https:// if not present (URL needs a protocol)
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    // Get the hostname and remove "www." if present
    return urlObj.hostname.replace(/^www\./, '');
  } catch (error) {
    // If URL is invalid, return null
    return null;
  }
}

/**
 * HELPER: Convert to number or null
 * 
 * What it does:
 * - Tries to convert a value to a number
 * - Returns null if it's empty or can't be converted
 * 
 * Examples:
 *   num("75") → 75
 *   num("") → null
 *   num("abc") → null
 */
function num(value) {
  // If empty, blank, or the word "null", return null
  if (!value || value === '' || value === 'null') return null;
  
  // Try to convert to number
  const parsed = Number(value);
  
  // If it's Not-a-Number, return null. Otherwise return the number
  return isNaN(parsed) ? null : parsed;
}

/**
 * HELPER: Convert date string to ISO format
 * 
 * What it does:
 * - Takes a date string like "2023-12-01"
 * - Converts to ISO format: "2023-12-01T00:00:00.000Z"
 * 
 * Why ISO format?
 * - ISO = International Standard
 * - MongoDB likes this format
 * - Easy to compare and sort dates
 */
function iso(dateStr) {
  // If empty or the word "null", return null
  if (!dateStr || dateStr === '' || dateStr === 'null') return null;
  
  try {
    // Convert to Date object
    const date = new Date(dateStr);
    
    // Check if valid date, return ISO string or null
    return isNaN(date.getTime()) ? null : date.toISOString();
  } catch (error) {
    // If date is invalid, return null
    return null;
  }
}

/**
 * HELPER: Combine and remove duplicates from arrays
 * 
 * What it does:
 * - Takes multiple arrays
 * - Combines them into one
 * - Removes any duplicates
 * 
 * Example:
 *   unionDedupe(['apple'], ['banana', 'apple']) → ['apple', 'banana']
 */
function unionDedupe(...arrays) {
  // Set = a collection that automatically removes duplicates
  const set = new Set();
  
  // Loop through each array
  arrays.forEach(arr => {
    if (Array.isArray(arr)) {
      // Loop through each item in the array
      arr.forEach(item => {
        if (item && typeof item === 'string') {
          set.add(item.trim());  // Add to set (trimming whitespace)
        }
      });
    }
  });
  
  // Convert Set back to Array and return
  return Array.from(set);
}

// ============================================================================
// MAIN FUNCTION: Ingest ESG Data
// ============================================================================
/**
 * FUNCTION: Import ESG data from CSV into MongoDB
 * 
 * What it does:
 * 1. Connects to MongoDB database
 * 2. Reads the CSV file
 * 3. For each row: creates/updates a company
 * 4. Shows a summary of what happened
 */
async function ingestESGData() {
  try {
    // STEP 1: Connect to MongoDB database
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ethical-product-finder';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // STEP 2: Find the CSV file
    // __dirname = the directory this script is in (backend/scripts/)
    // '..' = go up one level to backend/
    // 'data/dataset.csv' = the CSV file
    const csvPath = path.join(__dirname, '..', 'data', 'dataset.csv');
    
    // Check if the file exists
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    // STEP 3: Set up counters to track what happens
    const stats = {
      inserted: 0,        // How many new companies we created
      updated: 0,         // How many existing companies we updated
      skipped: 0,         // How many rows we skipped (bad data)
      skippedReasons: []  // Why we skipped them (for debugging)
    };

    // STEP 4: Set up the CSV parser
    // This tool reads CSV files and turns them into JavaScript objects
    const parser = parse({
      columns: true,           // First row has column names
      skip_empty_lines: true,  // Ignore blank lines
      trim: true               // Remove extra spaces
    });

    // Array to hold all the CSV rows
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
