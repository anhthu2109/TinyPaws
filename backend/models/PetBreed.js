const mongoose = require('mongoose');

const petBreedSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên giống là bắt buộc'],
        unique: true,
        trim: true,
        maxlength: [100, 'Tên giống không được quá 100 ký tự']
    },
    description: {
        type: String,
        required: [true, 'Mô tả là bắt buộc']
    },
    image_url: {
        type: String,
        required: [true, 'URL hình ảnh là bắt buộc'],
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+/i.test(v);
            },
            message: 'URL hình ảnh không hợp lệ'
        }
    },
    origin: {
        type: String,
        trim: true,
        maxlength: [100, 'Nguồn gốc không được quá 100 ký tự']
    },
    pet_type: {
        type: String,
        enum: {
            values: ['dog', 'cat', 'both'],
            message: 'Loại thú cưng phải là dog, cat hoặc both'
        },
        required: [true, 'Loại thú cưng là bắt buộc'],
        default: 'dog'
    },
    size: {
        type: String,
        enum: {
            values: ['small', 'medium', 'large', 'extra_large'],
            message: 'Kích thước phải là small, medium, large hoặc extra_large'
        }
    },
    temperament: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    life_span: {
        min_years: {
            type: Number,
            min: 1,
            max: 30
        },
        max_years: {
            type: Number,
            min: 1,
            max: 30
        }
    },
    weight_range: {
        min_kg: {
            type: Number,
            min: 0.5,
            max: 100
        },
        max_kg: {
            type: Number,
            min: 0.5,
            max: 100
        }
    },
    care_level: {
        type: String,
        enum: {
            values: ['easy', 'moderate', 'high'],
            message: 'Mức độ chăm sóc phải là easy, moderate hoặc high'
        },
        default: 'moderate'
    },
    is_popular: {
        type: Boolean,
        default: false
    },
    health_issues: [{
        type: String,
        trim: true
    }],
    grooming_needs: {
        type: String,
        enum: {
            values: ['low', 'moderate', 'high'],
            message: 'Nhu cầu chải chuốt phải là low, moderate hoặc high'
        },
        default: 'moderate'
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexing for better search performance
petBreedSchema.index({ name: 'text', description: 'text' });
petBreedSchema.index({ pet_type: 1 });
petBreedSchema.index({ size: 1 });
petBreedSchema.index({ is_popular: 1 });
petBreedSchema.index({ care_level: 1 });

// Virtual for formatted life span
petBreedSchema.virtual('formattedLifeSpan').get(function() {
    if (this.life_span && this.life_span.min_years && this.life_span.max_years) {
        if (this.life_span.min_years === this.life_span.max_years) {
            return `${this.life_span.min_years} năm`;
        }
        return `${this.life_span.min_years} - ${this.life_span.max_years} năm`;
    }
    return 'Không xác định';
});

// Virtual for formatted weight range
petBreedSchema.virtual('formattedWeightRange').get(function() {
    if (this.weight_range && this.weight_range.min_kg && this.weight_range.max_kg) {
        if (this.weight_range.min_kg === this.weight_range.max_kg) {
            return `${this.weight_range.min_kg} kg`;
        }
        return `${this.weight_range.min_kg} - ${this.weight_range.max_kg} kg`;
    }
    return 'Không xác định';
});

// Virtual for pet type in Vietnamese
petBreedSchema.virtual('petTypeVietnamese').get(function() {
    const typeMap = {
        'dog': 'Chó',
        'cat': 'Mèo',
        'both': 'Chó & Mèo'
    };
    return typeMap[this.pet_type] || this.pet_type;
});

// Virtual for size in Vietnamese
petBreedSchema.virtual('sizeVietnamese').get(function() {
    const sizeMap = {
        'small': 'Nhỏ',
        'medium': 'Trung bình',
        'large': 'Lớn',
        'extra_large': 'Rất lớn'
    };
    return sizeMap[this.size] || this.size;
});

// Virtual for care level in Vietnamese
petBreedSchema.virtual('careLevelVietnamese').get(function() {
    const careLevelMap = {
        'easy': 'Dễ',
        'moderate': 'Trung bình',
        'high': 'Khó'
    };
    return careLevelMap[this.care_level] || this.care_level;
});

// Static method to get popular breeds
petBreedSchema.statics.getPopularBreeds = function(petType = null, limit = 10) {
    const query = { is_popular: true };
    if (petType && ['dog', 'cat'].includes(petType)) {
        query.$or = [
            { pet_type: petType },
            { pet_type: 'both' }
        ];
    }
    
    return this.find(query)
        .sort({ name: 1 })
        .limit(limit);
};

// Static method for advanced search
petBreedSchema.statics.searchBreeds = function(options = {}) {
    const {
        search,
        pet_type,
        size,
        care_level,
        grooming_needs,
        is_popular,
        sortBy = 'name',
        sortOrder = 1,
        page = 1,
        limit = 12
    } = options;

    const query = {};
    
    // Text search
    if (search) {
        query.$text = { $search: search };
    }
    
    // Pet type filter
    if (pet_type && ['dog', 'cat'].includes(pet_type)) {
        query.$or = [
            { pet_type: pet_type },
            { pet_type: 'both' }
        ];
    }
    
    // Size filter
    if (size) {
        query.size = size;
    }
    
    // Care level filter
    if (care_level) {
        query.care_level = care_level;
    }
    
    // Grooming needs filter
    if (grooming_needs) {
        query.grooming_needs = grooming_needs;
    }
    
    // Popular filter
    if (is_popular !== undefined) {
        query.is_popular = is_popular === 'true';
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder };

    return this.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

// Instance method to toggle popular status
petBreedSchema.methods.togglePopular = function() {
    this.is_popular = !this.is_popular;
    return this.save();
};

// Pre-save validation for weight and life span ranges
petBreedSchema.pre('save', function(next) {
    // Validate weight range
    if (this.weight_range && this.weight_range.min_kg && this.weight_range.max_kg) {
        if (this.weight_range.min_kg > this.weight_range.max_kg) {
            return next(new Error('Trọng lượng tối thiểu không thể lớn hơn trọng lượng tối đa'));
        }
    }
    
    // Validate life span range
    if (this.life_span && this.life_span.min_years && this.life_span.max_years) {
        if (this.life_span.min_years > this.life_span.max_years) {
            return next(new Error('Tuổi thọ tối thiểu không thể lớn hơn tuổi thọ tối đa'));
        }
    }
    
    next();
});

module.exports = mongoose.model('PetBreed', petBreedSchema);
