const express = require('express');
const { body } = require('express-validator');
const Category = require('../models/Category');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

/* --------------------- VALIDATION --------------------- */
const categoryValidation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Tên danh mục phải có từ 1-100 ký tự'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Mô tả không được quá 500 ký tự'),
    body('subcategories')
        .optional()
        .isArray()
        .withMessage('Subcategories phải là một mảng'),
    body('subcategories.*.name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Tên danh mục con không được để trống hoặc quá 100 ký tự'),
];

/* --------------------- PUBLIC ROUTES --------------------- */

// Lấy tất cả danh mục (kèm danh mục con)
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh mục', error: error.message });
    }
});

// Lấy danh mục theo ID
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh mục', error: error.message });
    }
});

/* --------------------- ADMIN ROUTES --------------------- */

// Tạo danh mục mới
router.post('/', auth, adminAuth, categoryValidation, async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).json({ success: true, message: 'Tạo danh mục thành công', data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi tạo danh mục', error: error.message });
    }
});

// Cập nhật danh mục
router.put('/:id', auth, adminAuth, categoryValidation, async (req, res) => {
    try {
        const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục để cập nhật' });
        res.json({ success: true, message: 'Cập nhật danh mục thành công', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật danh mục', error: error.message });
    }
});

// Xóa danh mục
router.delete('/:id', auth, adminAuth, async (req, res) => {
    try {
        const deleted = await Category.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục để xóa' });
        res.json({ success: true, message: 'Xóa danh mục thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa danh mục', error: error.message });
    }
});

module.exports = router;
