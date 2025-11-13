const mongoose = require('mongoose');

const siteInfoSchema = new mongoose.Schema({
    // Basic contact information
    email: {
        type: String,
        required: [true, 'Email liên hệ là bắt buộc'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    phone_number: {
        type: String,
        required: [true, 'Số điện thoại liên hệ là bắt buộc'],
        trim: true,
        match: [/^[0-9]{10,11}$/, 'Số điện thoại phải có 10-11 chữ số']
    },
    address: {
        type: String,
        required: [true, 'Địa chỉ là bắt buộc'],
        trim: true,
        maxlength: [500, 'Địa chỉ không được quá 500 ký tự']
    },
    
    // Extended site information
    site_name: {
        type: String,
        default: 'TinyPaws Pet Shop',
        trim: true,
        maxlength: [100, 'Tên trang web không được quá 100 ký tự']
    },
    site_description: {
        type: String,
        default: 'Cửa hàng thú cưng uy tín, chất lượng cao',
        trim: true,
        maxlength: [500, 'Mô tả trang web không được quá 500 ký tự']
    },
    logo_url: {
        type: String,
        validate: {
            validator: function(v) {
                if (!v) return true; // Optional field
                return /^https?:\/\/.+/.test(v);
            },
            message: 'URL logo không hợp lệ'
        }
    },
    
    // Business hours
    business_hours: {
        monday: { type: String, default: '08:00 - 20:00' },
        tuesday: { type: String, default: '08:00 - 20:00' },
        wednesday: { type: String, default: '08:00 - 20:00' },
        thursday: { type: String, default: '08:00 - 20:00' },
        friday: { type: String, default: '08:00 - 20:00' },
        saturday: { type: String, default: '08:00 - 18:00' },
        sunday: { type: String, default: '09:00 - 17:00' }
    },
    
    // Social media links
    social_media: {
        facebook: {
            type: String,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^https?:\/\/(www\.)?facebook\.com\/.+/.test(v);
                },
                message: 'URL Facebook không hợp lệ'
            }
        },
        instagram: {
            type: String,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^https?:\/\/(www\.)?instagram\.com\/.+/.test(v);
                },
                message: 'URL Instagram không hợp lệ'
            }
        },
        youtube: {
            type: String,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^https?:\/\/(www\.)?youtube\.com\/.+/.test(v);
                },
                message: 'URL YouTube không hợp lệ'
            }
        },
        zalo: {
            type: String,
            validate: {
                validator: function(v) {
                    if (!v) return true;
                    return /^https?:\/\/zalo\.me\/.+/.test(v);
                },
                message: 'URL Zalo không hợp lệ'
            }
        }
    },
    
    // SEO settings
    seo: {
        meta_title: {
            type: String,
            default: 'TinyPaws - Cửa hàng thú cưng uy tín',
            maxlength: [60, 'Meta title không được quá 60 ký tự']
        },
        meta_description: {
            type: String,
            default: 'TinyPaws cung cấp thức ăn, phụ kiện chất lượng cao cho thú cưng. Giao hàng tận nơi, tư vấn miễn phí.',
            maxlength: [160, 'Meta description không được quá 160 ký tự']
        },
        meta_keywords: {
            type: [String],
            default: ['thú cưng', 'pet shop', 'thức ăn chó mèo', 'phụ kiện thú cưng']
        }
    },
    
    // Shipping and payment info
    shipping_info: {
        free_shipping_threshold: {
            type: Number,
            default: 500000, // 500k VND
            min: [0, 'Ngưỡng miễn phí ship không được âm']
        },
        shipping_fee: {
            type: Number,
            default: 30000, // 30k VND
            min: [0, 'Phí ship không được âm']
        },
        delivery_time: {
            type: String,
            default: '2-3 ngày làm việc'
        }
    },
    
    // Contact form settings
    contact_settings: {
        auto_reply_enabled: {
            type: Boolean,
            default: true
        },
        auto_reply_message: {
            type: String,
            default: 'Cảm ơn bạn đã liên hệ với TinyPaws! Chúng tôi sẽ phản hồi trong vòng 24 giờ.'
        }
    },
    
    // Maintenance mode
    maintenance: {
        enabled: {
            type: Boolean,
            default: false
        },
        message: {
            type: String,
            default: 'Trang web đang bảo trì. Vui lòng quay lại sau!'
        },
        estimated_time: {
            type: String,
            default: '2 giờ'
        }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Ensure only one document exists (singleton pattern)
siteInfoSchema.index({}, { unique: true });

// Virtual for formatted phone number
siteInfoSchema.virtual('formattedPhone').get(function() {
    if (!this.phone_number) return '';
    const phone = this.phone_number;
    if (phone.length === 10) {
        return `${phone.substring(0, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`;
    } else if (phone.length === 11) {
        return `${phone.substring(0, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`;
    }
    return phone;
});

// Virtual for business status
siteInfoSchema.virtual('isBusinessOpen').get(function() {
    const now = new Date();
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes(); // Format: HHMM
    
    const todayHours = this.business_hours[currentDay];
    if (!todayHours || todayHours === 'Đóng cửa') return false;
    
    const [openTime, closeTime] = todayHours.split(' - ');
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    
    const openTimeNum = openHour * 100 + openMin;
    const closeTimeNum = closeHour * 100 + closeMin;
    
    return currentTime >= openTimeNum && currentTime <= closeTimeNum;
});

// Virtual for formatted shipping threshold
siteInfoSchema.virtual('formattedShippingThreshold').get(function() {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.shipping_info.free_shipping_threshold);
});

// Virtual for formatted shipping fee
siteInfoSchema.virtual('formattedShippingFee').get(function() {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.shipping_info.shipping_fee);
});

// Static method to get site info (singleton)
siteInfoSchema.statics.getSiteInfo = function() {
    return this.findOne({});
};

// Static method to update site info (singleton with upsert)
siteInfoSchema.statics.updateSiteInfo = function(updateData) {
    return this.findOneAndUpdate(
        {}, // Empty filter to match any document
        updateData,
        {
            new: true,
            upsert: true, // Create if doesn't exist
            runValidators: true
        }
    );
};

// Static method to initialize default site info
siteInfoSchema.statics.initializeDefault = async function() {
    const existing = await this.findOne({});
    if (!existing) {
        return this.create({
            email: 'info@tinypaws.com',
            phone_number: '0901234567',
            address: '123 Đường ABC, Phường XYZ, Quận 1, TP.HCM'
        });
    }
    return existing;
};

// Pre-save middleware to ensure singleton
siteInfoSchema.pre('save', async function(next) {
    if (this.isNew) {
        const existingDoc = await this.constructor.findOne({});
        if (existingDoc) {
            const error = new Error('Chỉ được phép có một document SiteInfo');
            error.name = 'SingletonViolation';
            return next(error);
        }
    }
    next();
});

// Instance method to check if site is in maintenance mode
siteInfoSchema.methods.isInMaintenance = function() {
    return this.maintenance.enabled;
};

// Instance method to get today's business hours
siteInfoSchema.methods.getTodayHours = function() {
    const today = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
    return this.business_hours[today];
};

// Instance method to get all social media links
siteInfoSchema.methods.getSocialMediaLinks = function() {
    const links = [];
    Object.entries(this.social_media).forEach(([platform, url]) => {
        if (url) {
            links.push({
                platform: platform.charAt(0).toUpperCase() + platform.slice(1),
                url,
                icon: this.getSocialMediaIcon(platform)
            });
        }
    });
    return links;
};

// Instance method to get social media icon
siteInfoSchema.methods.getSocialMediaIcon = function(platform) {
    const icons = {
        facebook: '📘',
        instagram: '📷',
        youtube: '📺',
        zalo: '💬'
    };
    return icons[platform] || '🔗';
};

module.exports = mongoose.model('SiteInfo', siteInfoSchema);
