const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, generateRefreshToken, auth } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
    body('full_name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Họ tên phải có từ 2-100 ký tự'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email không hợp lệ'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
];

const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email không hợp lệ'),
    body('password')
        .notEmpty()
        .withMessage('Mật khẩu là bắt buộc')
];

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', registerValidation, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Register validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { full_name, email, password } = req.body;
        console.log('Register attempt:', { full_name, email, passwordLength: password?.length });

        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase().trim();
        console.log('Normalized email:', normalizedEmail);

        // Check if user already exists
        const existingUser = await User.findByEmail(normalizedEmail);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        // Create new user with normalized email
        const user = new User({
            full_name,
            email: normalizedEmail,
            hashed_password: password
        });

        await user.save();

        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                user: user.toJSON(),
                token,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;
        console.log('Login attempt:', { email, passwordLength: password?.length });

        // Find user by email (normalize to lowercase)
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findByEmail(normalizedEmail);
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        console.log('User found:', { id: user._id, email: user.email, hasPassword: !!user.hashed_password });

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        console.log('Password valid:', isPasswordValid);
        
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: user.toJSON(),
                token,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Map user data to profile format for PaymentPage
        const profile = {
            fullName: user.full_name || user.name || "",
            email: user.email || "",
            phone: user.phone || user.phone_number || "",
            province: user.shippingAddress?.province || user.city || "",
            district: user.shippingAddress?.district || "",
            ward: user.shippingAddress?.ward || "",
            detailAddress: user.shippingAddress?.detail || user.address || "",
        };

        // Check if user has recipient info
        const hasRecipientInfo = ['fullName', 'phone', 'province', 'district', 'ward', 'detailAddress']
            .some((key) => Boolean(profile[key]?.toString().trim()));

        console.log('📌 GET /auth/profile - User:', user.email);
        console.log('📌 Profile mapped:', profile);
        console.log('📌 Has recipient info:', hasRecipientInfo);

        return res.json({
            success: true,
            data: {
                user: user.toJSON(),
                profile,
                hasRecipientInfo,
            },
        });
    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
    body('full_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Họ tên phải có từ 2-100 ký tự'),
    body('phone_number')
        .optional()
        .trim(),
    body('city')
        .optional()
        .trim(),
    body('country')
        .optional()
        .trim(),
    body('address')
        .optional()
        .trim(),
    body('bio')
        .optional()
        .trim()
], async (req, res) => {
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

        const { full_name, phone_number, city, country, address, bio } = req.body;
        const userId = req.user._id;

        const updateData = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (phone_number !== undefined) updateData.phone_number = phone_number;
        if (city !== undefined) updateData.city = city;
        if (country !== undefined) updateData.country = country;
        if (address !== undefined) updateData.address = address;
        if (bio !== undefined) updateData.bio = bio;

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: {
                user: user.toJSON()
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, [
    body('currentPassword')
        .notEmpty()
        .withMessage('Mật khẩu hiện tại là bắt buộc'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
], async (req, res) => {
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

        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        // Get user with password field
        const user = await User.findById(userId).select('+password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// @route   POST /api/auth/wishlist/:productId
// @desc    Add product to wishlist
// @access  Private
router.post('/wishlist/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await User.findById(req.user._id);
        
        await user.addToWishlist(productId);
        
        res.json({
            success: true,
            message: 'Đã thêm vào danh sách yêu thích',
            data: {
                wishlist: user.wishlist
            }
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// @route   DELETE /api/auth/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/wishlist/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await User.findById(req.user._id);
        
        await user.removeFromWishlist(productId);
        
        res.json({
            success: true,
            message: 'Đã xóa khỏi danh sách yêu thích',
            data: {
                wishlist: user.wishlist
            }
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// @route   GET /api/auth/wishlist
// @desc    Get user wishlist
// @access  Private
router.get('/wishlist', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');
        
        res.json({
            success: true,
            data: {
                wishlist: user.wishlist
            }
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

module.exports = router;
