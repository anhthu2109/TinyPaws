const Category = require('../models/Category');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res) => {
    try {
        const { withProductCount } = req.query;
        
        let categories;
        if (withProductCount === 'true') {
            categories = await Category.getCategoriesWithProductCount();
        } else {
            categories = await Category.find().sort({ name: 1 });
        }

        res.json({
            success: true,
            data: {
                categories,
                total: categories.length
            }
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        // Get products in this category
        const products = await Product.find({ 
            category: req.params.id, 
            is_active: true 
        }).select('name price images stock_quantity');

        res.json({
            success: true,
            data: {
                category,
                products,
                productsCount: products.length
            }
        });
    } catch (error) {
        console.error('Get category by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Create new category
// @route   POST /api/admin/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { name, description } = req.body;

        // Check if category already exists
        const existingCategory = await Category.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') } 
        });
        
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Danh mục đã tồn tại'
            });
        }

        const category = new Category({
            name,
            description
        });

        await category.save();

        res.status(201).json({
            success: true,
            message: 'Tạo danh mục thành công',
            data: {
                category
            }
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { name, description } = req.body;
        
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        // Check if new name already exists (excluding current category)
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({ 
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: req.params.id }
            });
            
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên danh mục đã tồn tại'
                });
            }
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Cập nhật danh mục thành công',
            data: {
                category: updatedCategory
            }
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy danh mục'
            });
        }

        // Check if category has products
        const productsCount = await Product.countDocuments({ category: req.params.id });
        
        if (productsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Không thể xóa danh mục vì còn ${productsCount} sản phẩm`
            });
        }

        await Category.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Xóa danh mục thành công'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
