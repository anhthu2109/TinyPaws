const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/Product');

async function updateSalesCount() {
    // Connect to MongoDB first
    try {
        const mongoUri = process.env.MONGO_DB || process.env.MONGO_URI || 'mongodb://localhost:27017/TINYPAWS';
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    }
    try {
        console.log('🔄 Updating sales_count for products...\n');
        
        // Get all products
        const products = await Product.find({}).select('_id name sales_count');
        
        console.log(`📦 Found ${products.length} products\n`);
        
        // Update random sales_count for testing (between 0-500)
        const updates = products.map(async (product, index) => {
            // Give first 10 products higher sales_count for testing
            const salesCount = index < 10 
                ? Math.floor(Math.random() * 500) + 100  // 100-600
                : Math.floor(Math.random() * 50);         // 0-50
            
            await Product.findByIdAndUpdate(product._id, { 
                sales_count: salesCount 
            });
            
            console.log(`✅ ${product.name}: sales_count = ${salesCount}`);
        });
        
        await Promise.all(updates);
        
        console.log('\n✅ All products updated successfully!');
        console.log('\n📊 Top 10 bestsellers:');
        
        const bestsellers = await Product.find({ is_active: true })
            .select('name sales_count')
            .sort({ sales_count: -1 })
            .limit(10);
        
        bestsellers.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name}: ${product.sales_count} sold`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateSalesCount();
