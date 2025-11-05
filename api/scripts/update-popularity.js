/**
 * Script to calculate and update popularity scores for all products
 * Run this to update existing products with calculated popularity scores
 */

const mongoose = require('mongoose');
const config = require('../config');
const Product = require('../db/models/Product');

async function updatePopularityScores() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.DB.CONNECTION_STRING);
        console.log('Connected successfully!');

        // Get all products
        const products = await Product.find({ is_active: true });
        console.log(`Found ${products.length} products to update`);

        let updated = 0;
        
        for (const product of products) {
            // Calculate popularity score
            const popularityScore = Product.calculatePopularityScore(product);
            
            // Update the product
            await Product.findByIdAndUpdate(
                product._id,
                { popularity_score: popularityScore }
            );
            
            console.log(`Updated ${product.name}: score = ${popularityScore}`);
            updated++;
        }

        console.log(`\n✅ Successfully updated ${updated} products!`);
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error updating popularity scores:', error);
        process.exit(1);
    }
}

updatePopularityScores();

