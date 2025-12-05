const express = require('express');
const router = express.Router();
const {
    getRecommendations,
    getProductDetailRecommendations,
    trackProductView,
    addToWishlist,
    removeFromWishlist,
    addToCart,
    removeFromCart,
    getCart,
    getWishlist
} = require('../controllers/recommendationController');
const { auth } = require('../middleware/auth');

// ====================== RECOMMENDATION ROUTES ======================

// Get recommendations for user
router.get('/:userId', getRecommendations);

// Get product detail page recommendations (content-based)
router.get('/product/:productId', getProductDetailRecommendations);

// Track user behavior
router.post('/track/view', trackProductView);

// Wishlist routes
router.post('/wishlist/add', addToWishlist);
router.post('/wishlist/remove', removeFromWishlist);
router.get('/wishlist/:userId', getWishlist);

// Cart routes
router.post('/cart/add', addToCart);
router.post('/cart/remove', removeFromCart);
router.get('/cart/:userId', getCart);

module.exports = router;
