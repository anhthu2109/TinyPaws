const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

// ========== SUB-SCHEMA: Order Item ==========
const orderItemSchema = new mongoose.Schema({
    product_id: {
        type: ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Số lượng phải ít nhất là 1']
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Giá không được âm']
    },
    original_price: {
        type: Number,
        min: [0, 'Giá gốc không được âm']
    },
    sale_price: {
        type: Number,
        min: [0, 'Giá sale không được âm']
    },
    discount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number
    },
    image: {
        type: String // lưu ảnh đại diện sản phẩm
    }
});

// ========== MAIN SCHEMA ==========
const orderSchema = new mongoose.Schema(
    {
        order_number: {
            type: String,
            unique: true
        },
        user: {
            type: ObjectId,
            ref: 'User',
            required: true
        },
        items: [orderItemSchema],

        // Địa chỉ giao hàng
        shipping_address: {
            full_name: { type: String, required: true },
            phone: { type: String, required: true, match: /^[0-9]{10,11}$/ },
            email: { type: String },
            address: { type: String, required: true },
            ward: { type: String },      // Optional - không bắt buộc
            district: { type: String },  // Optional - không bắt buộc
            city: { type: String }       // Optional - không bắt buộc
        },

        // Thanh toán
        payment_method: {
            type: String,
            enum: ['cash_on_delivery', 'paypal', 'bank_transfer'],
            required: true
        },
        payment_status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded'],
            default: 'pending'
        },
        paypal_order_id: { type: String },

        // Tổng giá trị
        sub_total: { type: Number, min: 0, default: 0 },
        shipping_fee: { type: Number, min: 0, default: 0 },
        discount_amount: { type: Number, min: 0, default: 0 },
        final_total: { type: Number, min: 0, default: 0 },

        // Trạng thái đơn hàng
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
        },

        notes: { type: String, maxlength: 500 },

        // Thông tin giao hàng
        estimated_delivery: { type: Date },
        delivered_at: { type: Date },
        cancelled_at: { type: Date },
        cancel_reason: { type: String, maxlength: 200 },
        tracking_number: { type: String },
        courier: { type: String }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// ========== INDEXES ==========
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ payment_status: 1 });
orderSchema.index({ createdAt: -1 });

// ========== VIRTUALS ==========
orderSchema.virtual('statusVietnamese').get(function () {
    const map = {
        pending: 'Chờ xác nhận',
        confirmed: 'Đã xác nhận',
        processing: 'Đang xử lý',
        shipped: 'Đang giao hàng',
        delivered: 'Đã giao hàng',
        cancelled: 'Đã hủy'
    };
    return map[this.status] || this.status;
});

orderSchema.virtual('paymentMethodVietnamese').get(function () {
    const map = {
        cash_on_delivery: 'Thanh toán khi nhận hàng',
        paypal: 'PayPal',
        bank_transfer: 'Chuyển khoản ngân hàng'
    };
    return map[this.payment_method] || this.payment_method;
});

orderSchema.virtual('paymentStatusVietnamese').get(function () {
    const map = {
        pending: 'Chờ thanh toán',
        completed: 'Đã thanh toán',
        failed: 'Thanh toán thất bại',
        refunded: 'Đã hoàn tiền'
    };
    return map[this.payment_status] || this.payment_status;
});

orderSchema.virtual('formattedTotal').get(function () {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.final_total);
});

orderSchema.virtual('fullShippingAddress').get(function () {
    const a = this.shipping_address;
    return `${a.address}, ${a.ward}, ${a.district}, ${a.city}`;
});

orderSchema.virtual('total_items').get(function () {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
});

// ========== PRE-SAVE ==========
orderSchema.pre('save', async function (next) {
    if (this.isNew) {
        const date = new Date();
        const dateStr = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        this.order_number = `TP${dateStr}${randomNum}`;

        // giao hàng dự kiến 3–7 ngày
        const days = Math.floor(Math.random() * 5) + 3;
        this.estimated_delivery = new Date(Date.now() + days * 86400000);
    }

    // Tính lại các giá trị tiền
    this.items.forEach(i => {
        i.total = i.price * i.quantity - (i.discount || 0);
    });
    this.sub_total = this.items.reduce((sum, i) => sum + i.total, 0);
    this.final_total = this.sub_total + this.shipping_fee - this.discount_amount;

    next();
});

// ========== STATIC METHODS ==========
orderSchema.statics.getOrdersWithFilters = function (options = {}) {
    const {
        user,
        status,
        payment_status,
        payment_method,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = -1,
        page = 1,
        limit = 10
    } = options;

    const query = {};
    if (user) query.user = user;
    if (status) query.status = status;
    if (payment_status) query.payment_status = payment_status;
    if (payment_method) query.payment_method = payment_method;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return this.find(query)
        .populate('user', 'full_name email')
        .populate('items.product_id', 'name images')
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

// ========== STATISTICS ==========
orderSchema.statics.getOrderStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$final_total' }
            }
        }
    ]);

    const totalOrders = await this.countDocuments();
    const deliveredRevenue = await this.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$final_total' } } }
    ]);

    return {
        totalOrders,
        totalRevenue: deliveredRevenue[0]?.total || 0,
        statusBreakdown: stats
    };
};

// ========== INSTANCE METHODS ==========
orderSchema.methods.updateStatus = function (newStatus, reason = null) {
    this.status = newStatus;
    if (newStatus === 'delivered') {
        this.delivered_at = new Date();
        this.payment_status = 'completed';
    } else if (newStatus === 'cancelled') {
        this.cancelled_at = new Date();
        if (reason) this.cancel_reason = reason;
    }
    return this.save();
};

orderSchema.methods.canBeCancelled = function () {
    return ['pending', 'confirmed'].includes(this.status);
};

orderSchema.methods.canBeUpdated = function () {
    return this.status === 'pending';
};

// Hook: Tự động cập nhật sales_count khi order status thay đổi
orderSchema.post('save', async function(doc) {
    if (['processing', 'shipped', 'delivered'].includes(doc.status)) {
        const Product = mongoose.model('Product');
        
        for (const item of doc.items) {
            try {
                const Order = mongoose.model('Order');
                const salesData = await Order.aggregate([
                    {
                        $match: {
                            status: { $in: ['processing', 'shipped', 'delivered'] }
                        }
                    },
                    { $unwind: '$items' },
                    {
                        $match: {
                            'items.product_id': item.product_id
                        }
                    },
                    {
                        $group: {
                            _id: '$items.product_id',
                            total_sold: { $sum: '$items.quantity' }
                        }
                    }
                ]);
                
                if (salesData.length > 0) {
                    await Product.findByIdAndUpdate(
                        item.product_id,
                        { sales_count: salesData[0].total_sold }
                    );
                }
            } catch (error) {
                console.error('Error updating sales_count:', error);
            }
        }
    }
});

module.exports = mongoose.model('Order', orderSchema);
