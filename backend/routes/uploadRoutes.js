const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/uploadController');

// POST /api/upload - Upload ảnh lên Cloudinary
// Không cần auth để test, có thể thêm middleware sau
router.post('/', uploadImage);

module.exports = router;
