const mongoose = require('mongoose');

// Schema con cho subcategory
const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên danh mục con là bắt buộc'],
        trim: true,
        maxlength: [100, 'Tên danh mục con không được quá 100 ký tự']
    },
    target: {
        type: String,
        enum: ['dog', 'cat', 'both'],
        default: 'both'
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    }
}, { _id: false });


// Schema cha cho category
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên danh mục là bắt buộc'],
        unique: true,
        trim: true,
        maxlength: [100, 'Tên danh mục không được quá 100 ký tự']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Mô tả không được quá 500 ký tự']
    },
    type: {
        type: String,
        trim: true,
        maxlength: [100],
        default: 'general'
    },
    subcategories: [subCategorySchema]
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual đếm số sản phẩm thuộc category
categorySchema.virtual('productsCount', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category',
    count: true
});

// Static method: lấy categories kèm số lượng sản phẩm
categorySchema.statics.getCategoriesWithProductCount = function() {
    return this.aggregate([
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: 'category',
                as: 'products'
            }
        },
        {
            $addFields: {
                productsCount: { $size: '$products' }
            }
        },
        {
            $project: { products: 0 }
        },
        { $sort: { name: 1 } }
    ]);
};

module.exports = mongoose.model('Category', categorySchema);
