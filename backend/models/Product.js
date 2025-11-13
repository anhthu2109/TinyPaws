const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên sản phẩm là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tên sản phẩm không được quá 200 ký tự']
    },
    description: {
        type: String,
        required: [true, 'Mô tả là bắt buộc']
    },
    price: {
        type: Number,
        required: [true, 'Giá là bắt buộc'],
        min: [0, 'Giá không được âm']
    },
    sale_price: {
        type: Number,
        min: [0, 'Giá khuyến mãi không được âm'],
        default: null
    },
    stock_quantity: {
        type: Number,
        required: [true, 'Số lượng kho là bắt buộc'],
        min: [0, 'Số lượng kho không được âm'],
        default: 0
    },
    images: [{
        type: String,
        required: true
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Danh mục là bắt buộc']
    },
    target: {
        type: String,
        enum: ['dog', 'cat', 'both'],
        default: 'both',
        index: true
    },
    brand: {
        type: String,
        trim: true,
        default: null
    },
    tags: [{
        type: String,
        trim: true
    }],
    bestseller_score: {
        type: Number,
        default: 0,
        min: 0
    },
    sales_count: {
        type: Number,
        default: 0,
        min: 0,
        index: true
    },
    is_featured: {
        type: Boolean,
        default: false,
        index: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexing for better search performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ sales_count: -1 });
productSchema.index({ bestseller_score: -1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ is_active: 1 });
productSchema.index({ is_featured: 1, is_active: 1 });

// Virtual for availability status
productSchema.virtual('isAvailable').get(function() {
    return this.stock_quantity > 0 && this.is_active;
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.price);
});

// Static method to get bestsellers
productSchema.statics.getBestsellers = function(limit = 10) {
    return this.find({ is_active: true, stock_quantity: { $gt: 0 } })
        .select('name price sale_price images category stock_quantity sales_count bestseller_score is_active is_featured brand createdAt rating')
        .sort({ sales_count: -1, bestseller_score: -1, createdAt: -1 })
        .limit(Math.min(parseInt(limit), 10))
        .populate('category', 'name type')
        .lean();
};

// Static method to get featured products
productSchema.statics.getFeaturedProducts = function(limit = 10) {
    return this.find({ is_featured: true, is_active: true, stock_quantity: { $gt: 0 } })
        .select('name price sale_price images category stock_quantity sales_count is_featured is_active brand createdAt rating')
        .sort({ createdAt: -1 })
        .limit(Math.min(parseInt(limit), 20))
        .populate('category', 'name type')
        .lean();
};

// Static method for advanced search
productSchema.statics.searchProducts = function(options = {}) {
    const {
        search,
        category,
        minPrice,
        maxPrice,
        tags,
        sortBy = 'createdAt',
        sortOrder = -1,
        page = 1,
        limit = 12,
        inStock = false
    } = options;

    const query = { is_active: true };
    
    // Text search
    if (search) {
        query.$text = { $search: search };
    }
    
    // Category filter
    if (category) {
        // Category can be either string name or ObjectId
        query.category = category;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = minPrice;
        if (maxPrice) query.price.$lte = maxPrice;
    }
    
    // Tags filter
    if (tags && tags.length > 0) {
        query.tags = { $in: tags };
    }
    
    // Stock filter
    if (inStock) {
        query.stock_quantity = { $gt: 0 };
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return this.find(query)
        .select('name price sale_price images category stock_quantity bestseller_score is_active brand createdAt')
        .sort(sort)
        .skip(skip)
        .limit(Math.min(limit, 12)) // Cap at 12 products max
        .lean(); // Return plain JS objects, faster than mongoose documents
};

// Instance method to update bestseller score
productSchema.methods.updateBestsellerScore = function(score) {
    this.bestseller_score = Math.max(0, this.bestseller_score + score);
    return this.save();
};

// Instance method to decrease stock
productSchema.methods.decreaseStock = function(quantity) {
    if (this.stock_quantity >= quantity) {
        this.stock_quantity -= quantity;
        return this.save();
    }
    throw new Error('Không đủ hàng trong kho');
};

module.exports = mongoose.model('Product', productSchema);
