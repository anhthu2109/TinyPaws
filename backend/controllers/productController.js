const Product = require('../models/Product');

// ====================== PUBLIC CONTROLLERS ======================

// 🧩 Lấy sản phẩm nổi bật
const getFeaturedProducts = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const products = await Product.getFeaturedProducts(limit);
        
        res.status(200).json({
            success: true,
            data: {
                products,
                total: products.length
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy sản phẩm nổi bật', 
            error: error.message 
        });
    }
};

const getProducts = async (req, res) => {
    try {
        const {
            category,
            sort,
            tag,
            page = 1,
            limit = 12,
            search,
            minPrice,
            maxPrice,
            brand
        } = req.query;

        const decodedCategory = category ? decodeURIComponent(category) : undefined;
        let query = { is_active: true }; // Only show active products

        if (decodedCategory && decodedCategory !== 'all') {
            const mongoose = require('mongoose');
            // Check if it's a valid ObjectId
            if (mongoose.Types.ObjectId.isValid(decodedCategory)) {
                query.category = decodedCategory;
            } else {
                // If it's a category name, search by name (requires populate)
                query.category = { $regex: decodedCategory, $options: 'i' };
            }
        }

        if (tag) {
            switch (tag) {
                case 'daily_deal':
                    query.discount = { $gt: 0 };
                    break;
                case 'featured':
                    query.is_featured = true;
                    break;
                case 'new_arrivals':
                    query.isNew = true;
                    break;
                default:
                    query.tags = { $in: [tag] };
            }
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (brand) {
            query.brand = { $regex: brand, $options: 'i' };
        }

        let sortObject = {};
        switch (sort) {
            case 'bestseller':
                sortObject = { sales_count: -1, bestseller_score: -1, createdAt: -1 };
                break;
            case 'price_asc':
                sortObject = { price: 1 };
                break;
            case 'price_desc':
                sortObject = { price: -1 };
                break;
            case 'rating':
                sortObject = { rating: -1 };
                break;
            case 'createdAt':
                sortObject = { createdAt: -1 };
                break;
            default:
                sortObject = { updatedAt: -1, createdAt: -1 };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const products = await Product.find(query)
            .sort(sortObject)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('category', 'name type')
            .lean();

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        res.status(200).json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalProducts
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách sản phẩm', error: error.message });
    }
};

// 🧩 Lấy chi tiết sản phẩm
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
        }

        const product = await Product.findById(id).populate('category', 'name type');
        if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        if (!product.is_active) return res.status(404).json({ success: false, message: 'Sản phẩm không khả dụng' });

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

// 🧩 Lấy sản phẩm liên quan
const getRelatedProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 8 } = req.query;

        const currentProduct = await Product.findById(id);
        if (!currentProduct) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });

        const related = await Product.find({
            category: currentProduct.category,
            _id: { $ne: id },
            is_active: true
        })
            .populate('category', 'name type')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, data: { products: related, total: related.length } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

// ====================== ADMIN CONTROLLERS ======================

// 🧩 Lấy danh sách sản phẩm cho admin
const getAdminProducts = async (req, res) => {
    try {
        const {
            search,
            category,
            status,
            stock,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        const query = {};

        // Search filter
        if (search && search.trim()) {
            query.$or = [
                { name: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        // Category filter
        if (category && category !== 'all') {
            const mongoose = require('mongoose');
            // Check if it's a valid ObjectId
            if (mongoose.Types.ObjectId.isValid(category)) {
                query.category = category;
            } else {
                // If it's a category name, find the category first
                const Category = require('../models/Category');
                const categoryDoc = await Category.findOne({ 
                    name: { $regex: category, $options: 'i' } 
                });
                if (categoryDoc) {
                    query.category = categoryDoc._id;
                } else {
                    // No matching category found, return empty result
                    query.category = null;
                }
            }
        }

        // Status filter
        if (status && status !== 'all') {
            query.is_active = status === 'active';
        }

        // Stock filter
        if (stock && stock !== 'all') {
            switch (stock) {
                case 'in_stock':
                    query.stock_quantity = { $gt: 0 };
                    break;
                case 'out_of_stock':
                    query.stock_quantity = { $lte: 0 };
                    break;
                case 'low_stock':
                    query.stock_quantity = { $gt: 0, $lte: 10 };
                    break;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const products = await Product.find(query)
            .populate('category', 'name type')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalProducts,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách sản phẩm', error: error.message });
    }
};

// 🧩 Lấy chi tiết sản phẩm cho admin
const getAdminProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name type subcategories');
        if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết sản phẩm', error: error.message });
    }
};

// 🧩 Tạo mới sản phẩm
const createProduct = async (req, res) => {
    try {
        const productData = { ...req.body };
        
        // Convert target from frontend format to DB format
        if (productData.target) {
            const targetMap = {
                'cho': 'dog',
                'meo': 'cat',
                'ca-cho-va-meo': 'both'
            };
            productData.target = targetMap[productData.target] || productData.target;
        }
        
        // If category is provided and it's not a valid ObjectId, try to find category by name
        if (productData.category) {
            const mongoose = require('mongoose');
            
            // Check if it's already a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(productData.category) || productData.category.length !== 24) {
                // Try to find category by name
                const Category = require('../models/Category');
                const category = await Category.findOne({ name: productData.category });
                
                if (category) {
                    productData.category = category._id;
                } else {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Không tìm thấy danh mục "${productData.category}"` 
                    });
                }
            }
        }
        
        const product = new Product(productData);
        await product.save();
        
        // Populate category before returning
        await product.populate('category', 'name type');
        
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi tạo sản phẩm', error: error.message });
    }
};

// 🧩 Cập nhật sản phẩm
const updateProduct = async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        console.log('📦 Update product - Received data:', updateData);
        console.log('⭐ is_featured:', updateData.is_featured);
        console.log('🎯 Target before conversion:', updateData.target);
        
        // Convert target from frontend format to DB format
        if (updateData.target) {
            const targetMap = {
                'cho': 'dog',
                'meo': 'cat',
                'ca-cho-va-meo': 'both'
            };
            updateData.target = targetMap[updateData.target] || updateData.target;
            console.log('🎯 Target after conversion:', updateData.target);
        } else {
            console.log('⚠️ No target field in request!');
        }
        
        // If category is provided and it's not a valid ObjectId, try to find category by name
        if (updateData.category) {
            const mongoose = require('mongoose');
            
            // Check if it's already a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(updateData.category) || updateData.category.length !== 24) {
                // Try to find category by name
                const Category = require('../models/Category');
                const category = await Category.findOne({ name: updateData.category });
                
                if (category) {
                    updateData.category = category._id;
                } else {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Không tìm thấy danh mục "${updateData.category}"` 
                    });
                }
            }
        }
        
        console.log('💾 Updating product with data:', updateData);
        
        const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate('category', 'name type');
            
        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
        
        console.log('✅ Product updated successfully. Target:', product.target);
        
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật sản phẩm', error: error.message });
    }
};

// 🧩 Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Đã xóa sản phẩm' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa sản phẩm', error: error.message });
    }
};

// Search products
const searchProducts = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng nhập từ khóa tìm kiếm' 
            });
        }

        // Build search query with $regex for case-insensitive search
        const searchRegex = new RegExp(query, 'i');
        
        const searchQuery = {
            $or: [
                { name: searchRegex },
                { brand: searchRegex },
                { tags: { $in: [searchRegex] } }
            ],
            is_active: true
        };

        // Find products and populate category
        const products = await Product.find(searchQuery)
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .limit(50); // Limit results to 50

        res.status(200).json({
            success: true,
            data: {
                products,
                total: products.length,
                query: query
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi tìm kiếm sản phẩm', 
            error: error.message 
        });
    }
};

// 🧩 Cập nhật sales_count cho tất cả sản phẩm từ orders
const updateSalesCount = async (req, res) => {
    try {
        const Order = require('../models/Order');
        
        // Aggregate để tính tổng số lượng đã bán cho mỗi sản phẩm
        const salesData = await Order.aggregate([
            {
                $match: {
                    status: { $in: ['processing', 'shipped', 'delivered'] }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product_id',
                    total_sold: { $sum: '$items.quantity' }
                }
            }
        ]);

        // Cập nhật sales_count cho từng sản phẩm
        let updatedCount = 0;
        for (const item of salesData) {
            await Product.findByIdAndUpdate(
                item._id,
                { sales_count: item.total_sold },
                { new: true }
            );
            updatedCount++;
        }

        res.status(200).json({
            success: true,
            message: `Đã cập nhật sales_count cho ${updatedCount} sản phẩm`,
            data: { updatedCount }
        });
    } catch (error) {
        console.error('Update sales count error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật sales_count',
            error: error.message
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    getRelatedProducts,
    searchProducts,
    getFeaturedProducts,
    getAdminProducts,
    getAdminProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateSalesCount
};
