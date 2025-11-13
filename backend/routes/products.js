const express = require('express');
const { body } = require('express-validator');
const {
    getProducts,
    getProductById,
    getRelatedProducts,
    searchProducts,
    getFeaturedProducts,
    updateSalesCount
} = require('../controllers/productController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const productValidation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Tên sản phẩm phải có từ 1-200 ký tự'),
    body('description')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Mô tả là bắt buộc'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Giá phải là số dương'),
    body('stock_quantity')
        .isInt({ min: 0 })
        .withMessage('Số lượng kho phải là số nguyên không âm'),
    body('images')
        .isArray({ min: 1 })
        .withMessage('Phải có ít nhất 1 hình ảnh'),
    body('images.*')
        .isURL()
        .withMessage('URL hình ảnh không hợp lệ'),
    body('category')
        .isMongoId()
        .withMessage('ID danh mục không hợp lệ'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags phải là mảng'),
    body('is_featured')
        .optional()
        .isBoolean()
        .withMessage('Sản phẩm nổi bật phải là boolean')
];

const productUpdateValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Tên sản phẩm phải có từ 1-200 ký tự'),
    body('description')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Mô tả không được để trống'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Giá phải là số dương'),
    body('stock_quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Số lượng kho phải là số nguyên không âm'),
    body('images')
        .optional()
        .isArray({ min: 1 })
        .withMessage('Phải có ít nhất 1 hình ảnh'),
    body('images.*')
        .optional()
        .isURL()
        .withMessage('URL hình ảnh không hợp lệ'),
    body('category')
        .optional()
        .isMongoId()
        .withMessage('ID danh mục không hợp lệ'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags phải là mảng'),
    body('is_featured')
        .optional()
        .isBoolean()
        .withMessage('Sản phẩm nổi bật phải là boolean'),
    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('Trạng thái hoạt động phải là boolean')
];

// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id/related', getRelatedProducts);
router.get('/:id', getProductById);

// Admin routes
router.post('/update-sales-count', auth, adminAuth, updateSalesCount);

module.exports = router;
