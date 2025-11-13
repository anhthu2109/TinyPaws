const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    getFeaturedProducts,
    getBestsellerProducts,
    getDealProducts,
    getCategories,
    getBrands
} = require('../controllers/productController');

// Public routes

// GET /api/products - Lấy danh sách sản phẩm với filters
router.get('/', getProducts);

// GET /api/products/featured - Sản phẩm nổi bật
router.get('/featured', getFeaturedProducts);

// GET /api/products/bestsellers - Sản phẩm bán chạy
router.get('/bestsellers', getBestsellerProducts);

// GET /api/products/deals - Sản phẩm ưu đãi
router.get('/deals', getDealProducts);

// GET /api/products/categories - Danh sách categories
router.get('/categories', getCategories);

// GET /api/products/brands - Danh sách brands
router.get('/brands', getBrands);


// GET /api/products/:id - Chi tiết sản phẩm (phải để cuối cùng)
router.get('/:id', getProductById);

module.exports = router;
