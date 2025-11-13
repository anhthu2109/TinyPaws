const express = require('express');
const { body } = require('express-validator');
const {
    getBlogs,
    getFeaturedBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    getAdminBlogs,
    toggleFeatured,
    publishBlog
} = require('../controllers/blogController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const blogValidation = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Tiêu đề phải có từ 1-200 ký tự'),
    body('content')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Nội dung là bắt buộc'),
    body('excerpt')
        .optional()
        .trim()
        .isLength({ max: 300 })
        .withMessage('Tóm tắt không được quá 300 ký tự'),
    body('featured_image')
        .optional()
        .isURL()
        .withMessage('URL hình ảnh không hợp lệ'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags phải là mảng'),
    body('tags.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Mỗi tag phải có từ 1-50 ký tự'),
    body('status')
        .optional()
        .isIn(['draft', 'published', 'archived'])
        .withMessage('Trạng thái phải là draft, published hoặc archived'),
    body('is_featured')
        .optional()
        .isBoolean()
        .withMessage('Trạng thái nổi bật phải là boolean')
];

const blogUpdateValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Tiêu đề phải có từ 1-200 ký tự'),
    body('content')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Nội dung không được để trống'),
    body('excerpt')
        .optional()
        .trim()
        .isLength({ max: 300 })
        .withMessage('Tóm tắt không được quá 300 ký tự'),
    body('featured_image')
        .optional()
        .isURL()
        .withMessage('URL hình ảnh không hợp lệ'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags phải là mảng'),
    body('tags.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Mỗi tag phải có từ 1-50 ký tự'),
    body('status')
        .optional()
        .isIn(['draft', 'published', 'archived'])
        .withMessage('Trạng thái phải là draft, published hoặc archived'),
    body('is_featured')
        .optional()
        .isBoolean()
        .withMessage('Trạng thái nổi bật phải là boolean')
];

// Public routes
router.get('/', getBlogs);
router.get('/featured', getFeaturedBlogs);
router.get('/:id', getBlogById);

// Admin routes
router.get('/admin/all', auth, adminAuth, getAdminBlogs);
router.post('/admin/create', auth, adminAuth, blogValidation, createBlog);
router.put('/admin/:id', auth, adminAuth, blogUpdateValidation, updateBlog);
router.delete('/admin/:id', auth, adminAuth, deleteBlog);
router.patch('/admin/:id/featured', auth, adminAuth, toggleFeatured);
router.patch('/admin/:id/publish', auth, adminAuth, publishBlog);

module.exports = router;
