const express = require('express');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', auth, adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        
        const profile = mapUserToRecipientProfile(user);
        
        // Check if user has recipient info (excluding email which is always present)
        const hasRecipientInfo = ['fullName', 'phone', 'province', 'district', 'ward', 'detailAddress']
            .some((key) => Boolean(profile[key]?.toString().trim()));
        
        console.log('📌 GET /profile - User:', user.email);
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
        return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
});

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        const { fullName, email, phone, address = {} } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        
        // Update email
        if (email && email !== user.email) {
            const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
            }
            user.email = email;
        }
        
        // Update full name (sync both new and old fields)
        if (typeof fullName === 'string' && fullName.trim()) {
            user.full_name = fullName.trim();
            user.name = user.full_name;
        }
        
        // Update phone (sync both new and old fields)
        if (typeof phone === 'string' && phone.trim()) {
            const normalizedPhone = phone.trim();
            user.phone = normalizedPhone;
            user.phone_number = normalizedPhone;
        }
        
        // Update address (sync both nested shippingAddress and flat fields)
        if (address && typeof address === 'object') {
            // Update nested shippingAddress
            user.shippingAddress = {
                province: address.province?.trim() || user.shippingAddress?.province || "",
                district: address.district?.trim() || user.shippingAddress?.district || "",
                ward: address.ward?.trim() || user.shippingAddress?.ward || "",
                detail: address.detail?.trim() || user.shippingAddress?.detail || "",
            };
            
            // Sync flat fields for backward compatibility
            if (address.province?.trim()) {
                user.city = address.province.trim();
            }
            if (address.detail?.trim()) {
                user.address = address.detail.trim();
            }
        }
        
        await user.save();
        
        // Reload user to get updated data
        const updatedUser = await User.findById(req.user._id);
        const profile = mapUserToRecipientProfile(updatedUser);
        
        return res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: {
                user: updatedUser.toJSON(),
                profile,
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            data: {
                user
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private/Admin
router.put('/:id', auth, adminAuth, async (req, res) => {
    try {
        const { full_name, email, role } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Check if email is already taken by another user
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng'
                });
            }
        }

        const updateData = {};
        if (full_name) updateData.full_name = full_name;
        if (email) updateData.email = email;
        if (role && ['user', 'admin'].includes(role)) updateData.role = role;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Cập nhật người dùng thành công',
            data: {
                user: updatedUser
            }
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Prevent deleting admin user
        const isAdmin = user.role === 'admin' || user.isAdmin === true;
        if (isAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa tài khoản admin'
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Xóa người dùng thành công'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// Helper function to map user data to recipient profile format
const mapUserToRecipientProfile = (userDoc) => {
    const user = userDoc?.toObject ? userDoc.toObject() : userDoc;
    if (!user) {
        return { fullName: "", email: "", phone: "", province: "", district: "", ward: "", detailAddress: "" };
    }
    const shipping = user.shippingAddress || {};
    return {
        fullName: user.full_name || user.name || "",
        email: user.email || "",
        phone: user.phone || user.phone_number || "",
        province: shipping.province || user.city || "",
        district: shipping.district || "",
        ward: shipping.ward || "",
        detailAddress: shipping.detail || user.address || "",
    };
};

module.exports = router;
