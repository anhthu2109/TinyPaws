const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không có token, truy cập bị từ chối'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        // Load real user from MongoDB
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
};

// Middleware to check if user is admin (combines auth + admin check)
const adminAuth = async (req, res, next) => {
    try {
        // First verify token
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không có token, truy cập bị từ chối'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        // Load real user from MongoDB
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        req.user = user;
        
        // Check if user is admin
        const isAdmin = req.user.role === 'admin' || req.user.isAdmin === true;
        
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Truy cập bị từ chối. Chỉ admin mới có quyền.'
            });
        }
        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
};

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.REFRESH_TOKEN,
        { expiresIn: '30d' }
    );
};

module.exports = {
    auth,
    adminAuth,
    generateToken,
    generateRefreshToken
};
