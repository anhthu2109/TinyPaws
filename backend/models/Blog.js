const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề bài viết là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tiêu đề không được quá 200 ký tự']
    },
    content: {
        type: String,
        required: [true, 'Nội dung bài viết là bắt buộc']
    },
    author: {
        type: ObjectId,
        ref: 'User',
        required: [true, 'Tác giả là bắt buộc']
    },
    excerpt: {
        type: String,
        maxlength: [300, 'Tóm tắt không được quá 300 ký tự']
    },
    featured_image: {
        type: String,
        validate: {
            validator: function(v) {
                return !v || /^https?:\/\/.+/i.test(v);
            },
            message: 'URL hình ảnh không hợp lệ'
        }
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    status: {
        type: String,
        enum: {
            values: ['draft', 'published', 'archived'],
            message: 'Trạng thái phải là draft, published hoặc archived'
        },
        default: 'draft'
    },
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    reading_time: {
        type: Number, // Thời gian đọc ước tính (phút)
        min: 1
    },
    is_featured: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexing for better search performance
blogSchema.index({ title: 'text', content: 'text' });
blogSchema.index({ author: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ views: -1 });
blogSchema.index({ is_featured: 1 });

// Virtual for formatted creation date
blogSchema.virtual('formattedDate').get(function() {
    return this.createdAt.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});

// Virtual for short excerpt
blogSchema.virtual('shortExcerpt').get(function() {
    if (this.excerpt) {
        return this.excerpt;
    }
    // Auto-generate excerpt from content
    const plainText = this.content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
});

// Pre-save middleware to calculate reading time
blogSchema.pre('save', function(next) {
    if (this.isModified('content')) {
        // Calculate reading time (average 200 words per minute)
        const wordCount = this.content.split(/\s+/).length;
        this.reading_time = Math.ceil(wordCount / 200);
    }
    next();
});

// Static method to get published blogs
blogSchema.statics.getPublishedBlogs = function(options = {}) {
    const {
        search,
        tags,
        author,
        sortBy = 'createdAt',
        sortOrder = -1,
        page = 1,
        limit = 10,
        featured = false
    } = options;

    const query = { status: 'published' };
    
    // Text search
    if (search) {
        query.$text = { $search: search };
    }
    
    // Tags filter
    if (tags && tags.length > 0) {
        query.tags = { $in: tags };
    }
    
    // Author filter
    if (author) {
        query.author = author;
    }
    
    // Featured filter
    if (featured) {
        query.is_featured = true;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return this.find(query)
        .populate('author', 'full_name email')
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

// Static method to get featured blogs
blogSchema.statics.getFeaturedBlogs = function(limit = 5) {
    return this.find({ 
        status: 'published', 
        is_featured: true 
    })
    .populate('author', 'full_name email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Instance method to increment views
blogSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Instance method to toggle featured status
blogSchema.methods.toggleFeatured = function() {
    this.is_featured = !this.is_featured;
    return this.save();
};

// Instance method to publish blog
blogSchema.methods.publish = function() {
    this.status = 'published';
    return this.save();
};

// Instance method to archive blog
blogSchema.methods.archive = function() {
    this.status = 'archived';
    return this.save();
};

module.exports = mongoose.model('Blog', blogSchema);
