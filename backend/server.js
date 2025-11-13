const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'TinyPaws API Server is running!' });
});

// Debug route to check user
app.get('/debug/user/:email', async (req, res) => {
    try {
        const User = require('./models/User');
        const bcrypt = require('bcryptjs');
        
        const user = await User.findOne({ email: req.params.email.toLowerCase() }).select('+hashed_password +password');
        
        if (!user) {
            return res.json({ found: false, email: req.params.email });
        }

        // Test password
        const testPassword = '123456';
        let passwordValid = false;
        try {
            passwordValid = await user.comparePassword(testPassword);
        } catch (error) {
            console.error('comparePassword error:', error);
        }

        res.json({
            found: true,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            has_hashed_password: !!user.hashed_password,
            has_password: !!user.password,
            hashed_password_preview: user.hashed_password?.substring(0, 30) + '...',
            password_test_123456: passwordValid,
            hashed_password_starts_with: user.hashed_password?.substring(0, 4)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug route to fix invalid category values
app.post('/debug/fix-invalid-categories', async (req, res) => {
    try {
        const Product = require('./models/Product');
        const Category = require('./models/Category');
        const mongoose = require('mongoose');
        
        // Find all products
        const products = await Product.find().lean();
        let fixed = 0;
        const errors = [];
        
        for (const product of products) {
            // Check if category is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(product.category) || product.category.toString().length !== 24) {
                // Try to find matching category
                const categoryName = product.category.toString();
                
                // Try to extract category name from combined string
                let matchedCategory = null;
                const categories = await Category.find();
                
                // Try exact match first
                for (const cat of categories) {
                    if (categoryName.includes(cat.name)) {
                        matchedCategory = cat;
                        break;
                    }
                }
                
                // If no match, try keyword matching
                if (!matchedCategory) {
                    const categoryKeywords = {
                        'vệ sinh': 'Vệ sinh & Làm đẹp',
                        'thức ăn': 'Thức ăn',
                        'phụ kiện': 'Phụ kiện',
                        'đồ chơi': 'Đồ chơi'
                    };
                    
                    for (const [keyword, catName] of Object.entries(categoryKeywords)) {
                        if (categoryName.toLowerCase().includes(keyword)) {
                            matchedCategory = categories.find(c => c.name === catName);
                            break;
                        }
                    }
                }
                
                if (matchedCategory) {
                    await Product.updateOne(
                        { _id: product._id },
                        { $set: { category: matchedCategory._id } }
                    );
                    fixed++;
                } else {
                    errors.push({
                        productId: product._id,
                        productName: product.name,
                        invalidCategory: categoryName
                    });
                }
            }
        }
        
        res.json({
            success: true,
            message: 'Fixed invalid categories',
            fixed,
            errors
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug route to fix product categories
app.post('/debug/fix-categories', async (req, res) => {
    try {
        const Product = require('./models/Product');
        const Category = require('./models/Category');
        const mongoose = require('mongoose');

        // Get all categories
        const categories = await Category.find();
        
        // Category name mapping
        const categoryMap = {
            'Thức ăn cho chó': 'Thức ăn',
            'Thức ăn cho mèo': 'Thức ăn',
            'Phụ kiện cho chó': 'Phụ kiện',
            'Phụ kiện cho mèo': 'Phụ kiện',
            'Đồ chơi cho chó': 'Đồ chơi',
            'Đồ chơi cho mèo': 'Đồ chơi',
            'Vệ sinh & Làm đẹp': 'Vệ sinh & Làm đẹp'
        };

        // Get all products
        const products = await Product.find();
        
        let updated = 0;
        let skipped = 0;
        const results = [];

        for (const product of products) {
            // Check if category is already an ObjectId
            if (mongoose.Types.ObjectId.isValid(product.category) && 
                product.category.toString().length === 24) {
                skipped++;
                continue;
            }

            // Map old category name to new category name
            const oldCategoryName = product.category;
            const newCategoryName = categoryMap[oldCategoryName] || oldCategoryName;

            // Find category by name
            const category = categories.find(c => c.name === newCategoryName);

            if (category) {
                // Update product with category ObjectId
                await Product.updateOne(
                    { _id: product._id },
                    { 
                        $set: { 
                            category: category._id,
                            target: oldCategoryName.includes('chó') ? 'dog' : 
                                   oldCategoryName.includes('mèo') ? 'cat' : 'both'
                        } 
                    }
                );
                results.push({
                    product: product.name,
                    old: oldCategoryName,
                    new: category.name,
                    categoryId: category._id
                });
                updated++;
            }
        }

        res.json({
            success: true,
            message: 'Fixed product categories',
            updated,
            skipped,
            total: products.length,
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// NOTE: Mock auth endpoints removed - using real auth routes from ./routes/auth.js

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const adminRoutes = require('./routes/admin');
const orderRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/users');
const blogRoutes = require('./routes/blogs');
const recommendationRoutes = require('./routes/recommendations');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Handle 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}`);
});

module.exports = app;
