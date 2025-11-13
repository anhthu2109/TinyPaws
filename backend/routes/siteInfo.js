const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/siteInfoController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules for basic contact info
const contactValidation = [
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Email không hợp lệ'),
    body('phone_number')
        .optional()
        .matches(/^[0-9]{10,11}$/)
        .withMessage('Số điện thoại phải có 10-11 chữ số'),
    body('address')
        .optional()
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Địa chỉ phải có từ 10-500 ký tự')
];

// Validation rules for full site info update
const siteInfoValidation = [
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Email không hợp lệ'),
    body('phone_number')
        .optional()
        .matches(/^[0-9]{10,11}$/)
        .withMessage('Số điện thoại phải có 10-11 chữ số'),
    body('address')
        .optional()
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Địa chỉ phải có từ 10-500 ký tự'),
    body('site_name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Tên trang web phải có từ 1-100 ký tự'),
    body('site_description')
        .optional()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Mô tả trang web phải có từ 1-500 ký tự'),
    body('logo_url')
        .optional()
        .isURL()
        .withMessage('URL logo không hợp lệ'),
    body('business_hours.monday')
        .optional()
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc thứ 2 không đúng định dạng'),
    body('business_hours.tuesday')
        .optional()
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc thứ 3 không đúng định dạng'),
    body('business_hours.wednesday')
        .optional()
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc thứ 4 không đúng định dạng'),
    body('business_hours.thursday')
        .optional()
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc thứ 5 không đúng định dạng'),
    body('business_hours.friday')
        .optional()
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc thứ 6 không đúng định dạng'),
    body('business_hours.saturday')
        .optional()
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc thứ 7 không đúng định dạng'),
    body('business_hours.sunday')
        .optional()
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc chủ nhật không đúng định dạng'),
    body('social_media.facebook')
        .optional()
        .custom((value) => {
            if (value && !/^https?:\/\/(www\.)?facebook\.com\/.+/.test(value)) {
                throw new Error('URL Facebook không hợp lệ');
            }
            return true;
        }),
    body('social_media.instagram')
        .optional()
        .custom((value) => {
            if (value && !/^https?:\/\/(www\.)?instagram\.com\/.+/.test(value)) {
                throw new Error('URL Instagram không hợp lệ');
            }
            return true;
        }),
    body('social_media.youtube')
        .optional()
        .custom((value) => {
            if (value && !/^https?:\/\/(www\.)?youtube\.com\/.+/.test(value)) {
                throw new Error('URL YouTube không hợp lệ');
            }
            return true;
        }),
    body('social_media.zalo')
        .optional()
        .custom((value) => {
            if (value && !/^https?:\/\/zalo\.me\/.+/.test(value)) {
                throw new Error('URL Zalo không hợp lệ');
            }
            return true;
        }),
    body('seo.meta_title')
        .optional()
        .trim()
        .isLength({ max: 60 })
        .withMessage('Meta title không được quá 60 ký tự'),
    body('seo.meta_description')
        .optional()
        .trim()
        .isLength({ max: 160 })
        .withMessage('Meta description không được quá 160 ký tự'),
    body('seo.meta_keywords')
        .optional()
        .isArray()
        .withMessage('Meta keywords phải là mảng'),
    body('shipping_info.free_shipping_threshold')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Ngưỡng miễn phí ship phải là số không âm'),
    body('shipping_info.shipping_fee')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Phí ship phải là số không âm'),
    body('shipping_info.delivery_time')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Thời gian giao hàng phải có từ 1-100 ký tự'),
    body('maintenance.enabled')
        .optional()
        .isBoolean()
        .withMessage('Trạng thái bảo trì phải là boolean'),
    body('maintenance.message')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Thông báo bảo trì phải có từ 1-200 ký tự'),
    body('maintenance.estimated_time')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Thời gian ước tính bảo trì phải có từ 1-50 ký tự')
];

// Validation for business hours
const businessHoursValidation = [
    body('business_hours')
        .isObject()
        .withMessage('Giờ làm việc phải là object'),
    body('business_hours.monday')
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc thứ 2 không đúng định dạng'),
    body('business_hours.tuesday')
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc thứ 3 không đúng định dạng'),
    body('business_hours.wednesday')
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc thứ 4 không đúng định dạng'),
    body('business_hours.thursday')
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc thứ 5 không đúng định dạng'),
    body('business_hours.friday')
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc thứ 6 không đúng định dạng'),
    body('business_hours.saturday')
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc thứ 7 không đúng định dạng'),
    body('business_hours.sunday')
        .matches(/^(\d{2}:\d{2} - \d{2}:\d{2}|Đóng cửa)$/)
        .withMessage('Giờ làm việc chủ nhật không đúng định dạng')
];

// Validation for maintenance mode
const maintenanceValidation = [
    body('maintenance')
        .isObject()
        .withMessage('Thông tin bảo trì phải là object'),
    body('maintenance.enabled')
        .isBoolean()
        .withMessage('Trạng thái bảo trì phải là boolean'),
    body('maintenance.message')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Thông báo bảo trì phải có từ 1-200 ký tự'),
    body('maintenance.estimated_time')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Thời gian ước tính bảo trì phải có từ 1-50 ký tự')
];

// Validation for social media
const socialMediaValidation = [
    body('social_media')
        .isObject()
        .withMessage('Thông tin mạng xã hội phải là object'),
    body('social_media.facebook')
        .optional()
        .custom((value) => {
            if (value && !/^https?:\/\/(www\.)?facebook\.com\/.+/.test(value)) {
                throw new Error('URL Facebook không hợp lệ');
            }
            return true;
        }),
    body('social_media.instagram')
        .optional()
        .custom((value) => {
            if (value && !/^https?:\/\/(www\.)?instagram\.com\/.+/.test(value)) {
                throw new Error('URL Instagram không hợp lệ');
            }
            return true;
        }),
    body('social_media.youtube')
        .optional()
        .custom((value) => {
            if (value && !/^https?:\/\/(www\.)?youtube\.com\/.+/.test(value)) {
                throw new Error('URL YouTube không hợp lệ');
            }
            return true;
        }),
    body('social_media.zalo')
        .optional()
        .custom((value) => {
            if (value && !/^https?:\/\/zalo\.me\/.+/.test(value)) {
                throw new Error('URL Zalo không hợp lệ');
            }
            return true;
        })
];

// Validation for SEO settings
const seoValidation = [
    body('seo')
        .isObject()
        .withMessage('Thông tin SEO phải là object'),
    body('seo.meta_title')
        .optional()
        .trim()
        .isLength({ max: 60 })
        .withMessage('Meta title không được quá 60 ký tự'),
    body('seo.meta_description')
        .optional()
        .trim()
        .isLength({ max: 160 })
        .withMessage('Meta description không được quá 160 ký tự'),
    body('seo.meta_keywords')
        .optional()
        .isArray()
        .withMessage('Meta keywords phải là mảng')
];

// Public routes
router.get('/', getSiteInfo);
router.get('/contact', getContactInfo);
router.get('/status', getBusinessStatus);
router.get('/shipping', getShippingInfo);

// Admin routes (require admin privileges)
router.put('/admin/update', auth, adminAuth, siteInfoValidation, updateSiteInfo);
router.patch('/admin/contact', auth, adminAuth, contactValidation, updateContactInfo);
router.patch('/admin/hours', auth, adminAuth, businessHoursValidation, updateBusinessHours);
router.patch('/admin/maintenance', auth, adminAuth, maintenanceValidation, updateMaintenanceMode);
router.patch('/admin/social', auth, adminAuth, socialMediaValidation, updateSocialMedia);
router.patch('/admin/seo', auth, adminAuth, seoValidation, updateSEOSettings);

module.exports = router;
