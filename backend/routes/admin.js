const express = require('express');
const { body } = require('express-validator');
const {
    getAdminProducts,
    getAdminProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const {
    getDashboardStats,
    getRevenueChartData
} = require('../controllers/dashboardController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const productValidation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Tên sản phẩm phải có từ 1-200 ký tự'),
    body('description')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Mô tả không được để trống'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Giá phải là số dương'),
    body('stock_quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Số lượng kho phải là số nguyên không âm'),
    body('images')
        .optional()
        .isArray()
        .withMessage('Images phải là mảng'),
    body('images.*')
        .optional()
        .custom((value) => {
            // Chấp nhận data URLs (base64) hoặc HTTP/HTTPS URLs
            if (value.startsWith('data:image/')) {
                return true;
            }
            // Kiểm tra HTTP/HTTPS URL
            try {
                const url = new URL(value);
                return url.protocol === 'http:' || url.protocol === 'https:';
            } catch (_) {
                throw new Error('URL hình ảnh không hợp lệ');
            }
        })
        .withMessage('URL hình ảnh không hợp lệ'),
    body('category')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Danh mục là bắt buộc'),
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
    body('sale_price')
        .optional()
        .custom((value) => {
            if (value === null || value === undefined || value === '') {
                return true; // Allow null/empty
            }
            if (typeof value === 'number' && value >= 0) {
                return true;
            }
            throw new Error('Giá khuyến mãi phải là số không âm hoặc null');
        }),
    body('stock_quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Số lượng kho phải là số nguyên không âm'),
    body('images')
        .optional()
        .isArray()
        .withMessage('Images phải là mảng'),
    body('images.*')
        .optional()
        .custom((value) => {
            // Chấp nhận data URLs (base64) hoặc HTTP/HTTPS URLs
            if (value.startsWith('data:image/')) {
                // Kiểm tra kích thước base64 (khoảng 10MB)
                if (value.length > 10 * 1024 * 1024) {
                    throw new Error('Ảnh quá lớn (tối đa 10MB)');
                }
                return true;
            }
            // Kiểm tra HTTP/HTTPS URL
            try {
                const url = new URL(value);
                return url.protocol === 'http:' || url.protocol === 'https:';
            } catch (_) {
                throw new Error('URL hình ảnh không hợp lệ');
            }
        })
        .withMessage('URL hình ảnh không hợp lệ'),
    body('category')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Danh mục không được để trống'),
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

// Dashboard routes
router.get('/dashboard/stats', adminAuth, getDashboardStats);
router.get('/dashboard/revenue-chart', adminAuth, getRevenueChartData);

// Admin product routes
router.post('/products', adminAuth, productValidation, createProduct);
router.get('/products', adminAuth, getAdminProducts);
router.get('/products/:id', adminAuth, getAdminProductById);
router.put('/products/:id', adminAuth, productUpdateValidation, updateProduct);
router.delete('/products/:id', adminAuth, deleteProduct);

module.exports = router;
