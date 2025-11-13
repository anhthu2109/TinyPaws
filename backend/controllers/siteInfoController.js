const SiteInfo = require('../models/SiteInfo');
const { validationResult } = require('express-validator');

// @desc    Get site information
// @route   GET /api/site-info
// @access  Public
const getSiteInfo = async (req, res) => {
    try {
        let siteInfo = await SiteInfo.getSiteInfo();
        
        // If no site info exists, initialize with default values
        if (!siteInfo) {
            siteInfo = await SiteInfo.initializeDefault();
        }

        res.json({
            success: true,
            data: {
                siteInfo
            }
        });
    } catch (error) {
        console.error('Get site info error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get basic contact info (minimal response)
// @route   GET /api/site-info/contact
// @access  Public
const getContactInfo = async (req, res) => {
    try {
        let siteInfo = await SiteInfo.getSiteInfo();
        
        if (!siteInfo) {
            siteInfo = await SiteInfo.initializeDefault();
        }

        // Return only essential contact information
        const contactInfo = {
            email: siteInfo.email,
            phone_number: siteInfo.phone_number,
            formattedPhone: siteInfo.formattedPhone,
            address: siteInfo.address,
            business_hours: siteInfo.business_hours,
            isBusinessOpen: siteInfo.isBusinessOpen,
            todayHours: siteInfo.getTodayHours()
        };

        res.json({
            success: true,
            data: {
                contact: contactInfo
            }
        });
    } catch (error) {
        console.error('Get contact info error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get business status
// @route   GET /api/site-info/status
// @access  Public
const getBusinessStatus = async (req, res) => {
    try {
        let siteInfo = await SiteInfo.getSiteInfo();
        
        if (!siteInfo) {
            siteInfo = await SiteInfo.initializeDefault();
        }

        const status = {
            isOpen: siteInfo.isBusinessOpen,
            todayHours: siteInfo.getTodayHours(),
            isInMaintenance: siteInfo.isInMaintenance(),
            maintenanceMessage: siteInfo.maintenance.message,
            estimatedMaintenanceTime: siteInfo.maintenance.estimated_time
        };

        res.json({
            success: true,
            data: {
                status
            }
        });
    } catch (error) {
        console.error('Get business status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get shipping information
// @route   GET /api/site-info/shipping
// @access  Public
const getShippingInfo = async (req, res) => {
    try {
        let siteInfo = await SiteInfo.getSiteInfo();
        
        if (!siteInfo) {
            siteInfo = await SiteInfo.initializeDefault();
        }

        const shippingInfo = {
            free_shipping_threshold: siteInfo.shipping_info.free_shipping_threshold,
            formattedThreshold: siteInfo.formattedShippingThreshold,
            shipping_fee: siteInfo.shipping_info.shipping_fee,
            formattedFee: siteInfo.formattedShippingFee,
            delivery_time: siteInfo.shipping_info.delivery_time
        };

        res.json({
            success: true,
            data: {
                shipping: shippingInfo
            }
        });
    } catch (error) {
        console.error('Get shipping info error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Update site information (Admin only)
// @route   PUT /api/admin/site-info
// @access  Private/Admin
const updateSiteInfo = async (req, res) => {
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

        const updateData = req.body;
        
        // Remove any fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.__v;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        const siteInfo = await SiteInfo.updateSiteInfo(updateData);

        res.json({
            success: true,
            message: 'Cập nhật thông tin trang web thành công',
            data: {
                siteInfo
            }
        });
    } catch (error) {
        console.error('Update site info error:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Update basic contact info (Admin only)
// @route   PATCH /api/admin/site-info/contact
// @access  Private/Admin
const updateContactInfo = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { email, phone_number, address } = req.body;
        
        const updateData = {};
        if (email !== undefined) updateData.email = email;
        if (phone_number !== undefined) updateData.phone_number = phone_number;
        if (address !== undefined) updateData.address = address;

        const siteInfo = await SiteInfo.updateSiteInfo(updateData);

        res.json({
            success: true,
            message: 'Cập nhật thông tin liên hệ thành công',
            data: {
                contact: {
                    email: siteInfo.email,
                    phone_number: siteInfo.phone_number,
                    formattedPhone: siteInfo.formattedPhone,
                    address: siteInfo.address
                }
            }
        });
    } catch (error) {
        console.error('Update contact info error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Update business hours (Admin only)
// @route   PATCH /api/admin/site-info/hours
// @access  Private/Admin
const updateBusinessHours = async (req, res) => {
    try {
        const { business_hours } = req.body;
        
        if (!business_hours) {
            return res.status(400).json({
                success: false,
                message: 'Giờ làm việc là bắt buộc'
            });
        }

        const siteInfo = await SiteInfo.updateSiteInfo({ business_hours });

        res.json({
            success: true,
            message: 'Cập nhật giờ làm việc thành công',
            data: {
                business_hours: siteInfo.business_hours,
                isBusinessOpen: siteInfo.isBusinessOpen,
                todayHours: siteInfo.getTodayHours()
            }
        });
    } catch (error) {
        console.error('Update business hours error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Update maintenance mode (Admin only)
// @route   PATCH /api/admin/site-info/maintenance
// @access  Private/Admin
const updateMaintenanceMode = async (req, res) => {
    try {
        const { maintenance } = req.body;
        
        if (!maintenance) {
            return res.status(400).json({
                success: false,
                message: 'Thông tin bảo trì là bắt buộc'
            });
        }

        const siteInfo = await SiteInfo.updateSiteInfo({ maintenance });

        res.json({
            success: true,
            message: `${maintenance.enabled ? 'Bật' : 'Tắt'} chế độ bảo trì thành công`,
            data: {
                maintenance: siteInfo.maintenance,
                isInMaintenance: siteInfo.isInMaintenance()
            }
        });
    } catch (error) {
        console.error('Update maintenance mode error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Update social media links (Admin only)
// @route   PATCH /api/admin/site-info/social
// @access  Private/Admin
const updateSocialMedia = async (req, res) => {
    try {
        const { social_media } = req.body;
        
        if (!social_media) {
            return res.status(400).json({
                success: false,
                message: 'Thông tin mạng xã hội là bắt buộc'
            });
        }

        const siteInfo = await SiteInfo.updateSiteInfo({ social_media });

        res.json({
            success: true,
            message: 'Cập nhật mạng xã hội thành công',
            data: {
                social_media: siteInfo.social_media,
                socialLinks: siteInfo.getSocialMediaLinks()
            }
        });
    } catch (error) {
        console.error('Update social media error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Update SEO settings (Admin only)
// @route   PATCH /api/admin/site-info/seo
// @access  Private/Admin
const updateSEOSettings = async (req, res) => {
    try {
        const { seo } = req.body;
        
        if (!seo) {
            return res.status(400).json({
                success: false,
                message: 'Thông tin SEO là bắt buộc'
            });
        }

        const siteInfo = await SiteInfo.updateSiteInfo({ seo });

        res.json({
            success: true,
            message: 'Cập nhật SEO thành công',
            data: {
                seo: siteInfo.seo
            }
        });
    } catch (error) {
        console.error('Update SEO settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = {
    getSiteInfo,
    getContactInfo,
    getBusinessStatus,
    getShippingInfo,
    updateSiteInfo,
    updateContactInfo,
    updateBusinessHours,
    updateMaintenanceMode,
    updateSocialMedia,
    updateSEOSettings
};
