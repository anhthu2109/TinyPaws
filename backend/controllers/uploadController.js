const { cloudinary } = require('../middleware/cloudinary');
const multer = require('multer');
const path = require('path');

// Cấu hình Multer (lưu tạm trong RAM)
const storage = multer.memoryStorage();

// Chỉ cho phép file ảnh
const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Định dạng ảnh không hợp lệ. Chỉ chấp nhận .jpg, .jpeg, .png, .webp'));
    }
};

// Giới hạn dung lượng tối đa 2MB
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter
}).single('image');

// Controller upload ảnh lên Cloudinary
const uploadImage = async (req, res) => {
    upload(req, res, async (err) => {
        try {
            // Lỗi từ multer
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    success: false,
                    message: err.code === 'LIMIT_FILE_SIZE'
                        ? 'Ảnh vượt quá dung lượng tối đa 2MB'
                        : 'Lỗi upload file'
                });
            } else if (err) {
                return res.status(400).json({ 
                    success: false, 
                    message: err.message 
                });
            }

            // Không có file
            if (!req.file) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Không có ảnh được gửi lên' 
                });
            }

            // Upload lên Cloudinary từ buffer
            const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            const result = await cloudinary.uploader.upload(base64, {
                folder: 'TinyPaws/products',
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto' },
                    { format: 'webp' }
                ],
            });

            return res.status(200).json({
                success: true,
                message: 'Upload ảnh thành công',
                url: result.secure_url,
                public_id: result.public_id
            });
            
        } catch (error) {
            console.error('❌ Upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi upload ảnh',
                error: error.message
            });
        }
    });
};

module.exports = { uploadImage };
