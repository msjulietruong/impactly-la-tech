// backend/controllers/embeddingsController.js

import { ObjectId } from 'mongodb';
import { pipeline } from '@xenova/transformers';
import mongoose from 'mongoose';

// Grade ranking (A is best, E is worst)
const GRADE_SCORES = { 'a': 5, 'b': 4, 'c': 3, 'd': 2, 'e': 1, '': 0 };

// Initialize embedding model (loads once)
let embedder;

export async function initializeEmbedder() {
  if (!embedder) {
    console.log('Loading embedding model...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✓ Embedding model loaded');
  }
  return embedder;
}

// Create embedding from product
async function createEmbedding(product) {
  if (!embedder) {
    await initializeEmbedder();
  }
  const text = `${product.product_name || ''} ${product.categories || ''} ${product.brands || ''}`;
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Get native MongoDB collection (since you use mongoose)
function getFoodCollection() {
  return mongoose.connection.db.collection('food');
}

// Generate embeddings for all products
export async function generateEmbeddings(req, res) {
  try {
    await initializeEmbedder();
    
    const foodCollection = getFoodCollection();

    // Debug: Check what's in the database
    const totalProducts = await foodCollection.countDocuments();
    console.log('Total products in collection:', totalProducts);
    
    // Check a sample product
    const sampleProduct = await foodCollection.findOne({});
    console.log('Sample product embedding:', sampleProduct?.embedding);
    console.log('Sample product embedding type:', typeof sampleProduct?.embedding);
    console.log('Sample product embedding length:', sampleProduct?.embedding?.length);

    const products = await foodCollection.find({
  $or: [
    { embedding: { $exists: false } },
    { embedding: { $size: 0 } },
    { embedding: null }
  ]
}).toArray();
    
    console.log('Products found needing embeddings:', products.length);
    if (products.length === 0) {
      console.log('First product:', products[0].product_name);
      console.log('First product embedding:', products[0].embedding);
      return res.json({ 
        success: true, 
        message: 'All products already have embeddings',
        embedded: 0 
      });
    }
    
    let count = 0;
    for (const product of products) {
      const embedding = await createEmbedding(product);
      await foodCollection.updateOne(
        { _id: product._id },
        { $set: { embedding } }
      );
      count++;
      console.log(`✓ Embedded: ${product.product_name} (${count}/${products.length})`);
    }
    
    res.json({ 
      success: true, 
      embedded: count,
      message: `Successfully generated embeddings for ${count} products`
    });
  } catch (error) {
    console.error('Error generating embeddings:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get better alternatives for a product
export async function getBetterAlternatives(req, res) {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 5;
    
    const foodCollection = getFoodCollection();
    
    // Get original product
    const product = await foodCollection.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (!product.embedding) {
      return res.status(400).json({ 
        error: 'Product has no embedding. Run POST /api/embeddings/generate first' 
      });
    }
    
    // Get product's environmental grade
    const originalGrade = String(product.environmental_score_grade || '').toLowerCase();
    const originalScore = GRADE_SCORES[originalGrade] || 0;
    
    // Get category for filtering
    const category = product.categories ? product.categories.split(',')[0] : '';
    
    // Get all candidates in same category
    const query = {
      _id: { $ne: product._id },
      embedding: { $exists: true }
    };
    
    if (category) {
      query.categories = { $regex: category, $options: 'i' };
    }
    
    const candidates = await foodCollection.find(query).toArray();
    
    // Find better alternatives
    const alternatives = [];
    
    for (const candidate of candidates) {
      // Calculate similarity
      const similarity = cosineSimilarity(product.embedding, candidate.embedding);
      
      // Only include if reasonably similar (same product type)
      if (similarity > 0.6) {
        // Check if environmental grade is better
        const candidateGrade = String(candidate.environmental_score_grade || '').toLowerCase();
        const candidateScore = GRADE_SCORES[candidateGrade] || 0;
        
        if (candidateScore > originalScore) {
          alternatives.push({
            _id: candidate._id,
            code: candidate.code,
            product_name: candidate.product_name,
            brands: candidate.brands,
            categories: candidate.categories,
            environmental_score_grade: candidate.environmental_score_grade,
            image_url: candidate.image_url,
            origins: candidate.origins,
            manufacturing_places: candidate.manufacturing_places,
            similarity: Math.round(similarity * 100) / 100,
            grade_improvement: candidateScore - originalScore
          });
        }
      }
    }
    
    // Sort by grade improvement first, then similarity
    alternatives.sort((a, b) => {
      if (b.grade_improvement !== a.grade_improvement) {
        return b.grade_improvement - a.grade_improvement;
      }
      return b.similarity - a.similarity;
    });
    
    res.json({
      original_product: {
        _id: product._id,
        code: product.code,
        product_name: product.product_name,
        environmental_score_grade: product.environmental_score_grade,
        categories: product.categories
      },
      alternatives: alternatives.slice(0, limit)
    });
    
  } catch (error) {
    console.error('Error getting alternatives:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get product by ID
export async function getProductById(req, res) {
  try {
    const foodCollection = getFoodCollection();
    const product = await foodCollection.findOne({ _id: new ObjectId(req.params.productId) });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ error: error.message });
  }
}

// Search products by name
export async function searchProducts(req, res) {
  try {
    const { query } = req.params;
    const foodCollection = getFoodCollection();
    
    const products = await foodCollection
      .find({ 
        product_name: { $regex: query, $options: 'i' } 
      })
      .limit(10)
      .toArray();
    
    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function debugGradeStats(req, res) {
  try {
    const foodCollection = getFoodCollection();
    
    const gradeStats = await foodCollection.aggregate([
      {
        $group: {
          _id: '$environmental_score_grade',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    const totalProducts = await foodCollection.countDocuments();
    const withEmbeddings = await foodCollection.countDocuments({ embedding: { $exists: true, $ne: [] } });
    const withGrades = await foodCollection.countDocuments({ 
      environmental_score_grade: { $nin: ['unknown', '', null] } 
    });
    
    res.json({
      totalProducts,
      withEmbeddings,
      withGrades,
      gradeBreakdown: gradeStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function searchCompanyESG(req, res) {
  try {
    const { query } = req.query;
    const mongoose = (await import('mongoose')).default;
    const esgCollection = mongoose.connection.db.collection('esg_scores');
    
    const companies = await esgCollection
      .find({ 
        name: { $regex: query, $options: 'i' } 
      })
      .limit(10)
      .project({ name: 1, ticker: 1, total_level: 1 })
      .toArray();
    
    res.json({ count: companies.length, companies });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}