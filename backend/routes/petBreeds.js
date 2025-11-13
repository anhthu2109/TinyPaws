const express = require('express');
const { body } = require('express-validator');
const {
    getPetBreeds,
    getPopularBreeds,
    getPetBreedById,
    createPetBreed,
    updatePetBreed,
    deletePetBreed,
    getAdminPetBreeds,
    togglePopular
} = require('../controllers/petBreedController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const petBreedValidation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Tên giống phải có từ 1-100 ký tự'),
    body('description')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Mô tả là bắt buộc'),
    body('image_url')
        .isURL()
        .withMessage('URL hình ảnh không hợp lệ'),
    body('origin')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Nguồn gốc không được quá 100 ký tự'),
    body('pet_type')
        .isIn(['dog', 'cat', 'both'])
        .withMessage('Loại thú cưng phải là dog, cat hoặc both'),
    body('size')
        .optional()
        .isIn(['small', 'medium', 'large', 'extra_large'])
        .withMessage('Kích thước phải là small, medium, large hoặc extra_large'),
    body('temperament')
        .optional()
        .isArray()
        .withMessage('Tính cách phải là mảng'),
    body('temperament.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Mỗi tính cách phải có từ 1-50 ký tự'),
    body('life_span.min_years')
        .optional()
        .isInt({ min: 1, max: 30 })
        .withMessage('Tuổi thọ tối thiểu phải từ 1-30 năm'),
    body('life_span.max_years')
        .optional()
        .isInt({ min: 1, max: 30 })
        .withMessage('Tuổi thọ tối đa phải từ 1-30 năm'),
    body('weight_range.min_kg')
        .optional()
        .isFloat({ min: 0.5, max: 100 })
        .withMessage('Trọng lượng tối thiểu phải từ 0.5-100 kg'),
    body('weight_range.max_kg')
        .optional()
        .isFloat({ min: 0.5, max: 100 })
        .withMessage('Trọng lượng tối đa phải từ 0.5-100 kg'),
    body('care_level')
        .optional()
        .isIn(['easy', 'moderate', 'high'])
        .withMessage('Mức độ chăm sóc phải là easy, moderate hoặc high'),
    body('is_popular')
        .optional()
        .isBoolean()
        .withMessage('Trạng thái phổ biến phải là boolean'),
    body('health_issues')
        .optional()
        .isArray()
        .withMessage('Vấn đề sức khỏe phải là mảng'),
    body('health_issues.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Mỗi vấn đề sức khỏe phải có từ 1-100 ký tự'),
    body('grooming_needs')
        .optional()
        .isIn(['low', 'moderate', 'high'])
        .withMessage('Nhu cầu chải chuốt phải là low, moderate hoặc high')
];

const petBreedUpdateValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Tên giống phải có từ 1-100 ký tự'),
    body('description')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Mô tả không được để trống'),
    body('image_url')
        .optional()
        .isURL()
        .withMessage('URL hình ảnh không hợp lệ'),
    body('origin')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Nguồn gốc không được quá 100 ký tự'),
    body('pet_type')
        .optional()
        .isIn(['dog', 'cat', 'both'])
        .withMessage('Loại thú cưng phải là dog, cat hoặc both'),
    body('size')
        .optional()
        .isIn(['small', 'medium', 'large', 'extra_large'])
        .withMessage('Kích thước phải là small, medium, large hoặc extra_large'),
    body('temperament')
        .optional()
        .isArray()
        .withMessage('Tính cách phải là mảng'),
    body('temperament.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Mỗi tính cách phải có từ 1-50 ký tự'),
    body('life_span.min_years')
        .optional()
        .isInt({ min: 1, max: 30 })
        .withMessage('Tuổi thọ tối thiểu phải từ 1-30 năm'),
    body('life_span.max_years')
        .optional()
        .isInt({ min: 1, max: 30 })
        .withMessage('Tuổi thọ tối đa phải từ 1-30 năm'),
    body('weight_range.min_kg')
        .optional()
        .isFloat({ min: 0.5, max: 100 })
        .withMessage('Trọng lượng tối thiểu phải từ 0.5-100 kg'),
    body('weight_range.max_kg')
        .optional()
        .isFloat({ min: 0.5, max: 100 })
        .withMessage('Trọng lượng tối đa phải từ 0.5-100 kg'),
    body('care_level')
        .optional()
        .isIn(['easy', 'moderate', 'high'])
        .withMessage('Mức độ chăm sóc phải là easy, moderate hoặc high'),
    body('is_popular')
        .optional()
        .isBoolean()
        .withMessage('Trạng thái phổ biến phải là boolean'),
    body('health_issues')
        .optional()
        .isArray()
        .withMessage('Vấn đề sức khỏe phải là mảng'),
    body('health_issues.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Mỗi vấn đề sức khỏe phải có từ 1-100 ký tự'),
    body('grooming_needs')
        .optional()
        .isIn(['low', 'moderate', 'high'])
        .withMessage('Nhu cầu chải chuốt phải là low, moderate hoặc high')
];

// Public routes
router.get('/', getPetBreeds);
router.get('/popular', getPopularBreeds);
router.get('/:id', getPetBreedById);

// Admin routes
router.get('/admin/all', auth, adminAuth, getAdminPetBreeds);
router.post('/admin/create', auth, adminAuth, petBreedValidation, createPetBreed);
router.put('/admin/:id', auth, adminAuth, petBreedUpdateValidation, updatePetBreed);
router.delete('/admin/:id', auth, adminAuth, deletePetBreed);
router.patch('/admin/:id/popular', auth, adminAuth, togglePopular);

module.exports = router;
