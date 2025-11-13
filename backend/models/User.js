const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Vui lòng nhập email hợp lệ'
        ]
    },
    // New field
    hashed_password: {
        type: String,
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
    },
    // Old field for backward compatibility
    password: {
        type: String,
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
    },
    // New field
    full_name: {
        type: String,
        trim: true,
        minlength: [2, 'Họ tên phải có ít nhất 2 ký tự'],
        maxlength: [100, 'Họ tên không được quá 100 ký tự']
    },
    // Old field for backward compatibility
    name: {
        type: String,
        trim: true,
        minlength: [2, 'Tên phải có ít nhất 2 ký tự'],
        maxlength: [100, 'Tên không được quá 100 ký tự']
    },
    // New field
    role: {
        type: String,
        enum: {
            values: ['user', 'admin'],
            message: 'Role phải là user hoặc admin'
        },
        default: 'user',
        index: true
    },
    // Old field for backward compatibility
    isAdmin: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String,
        trim: true
    },
    phone_number: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    country: {
        type: String,
        trim: true,
        default: 'Việt Nam'
    },
    address: {
        type: String,
        trim: true
    },
    shippingAddress: {
        province: { type: String, trim: true },
        district: { type: String, trim: true },
        ward: { type: String, trim: true },
        detail: { type: String, trim: true }
    },
    bio: {
        type: String,
        trim: true
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.hashed_password;
            delete ret.password;
            // Use new fields in response
            if (ret.name && !ret.full_name) {
                ret.full_name = ret.name;
            }
            if (typeof ret.isAdmin === 'boolean' && !ret.role) {
                ret.role = ret.isAdmin ? 'admin' : 'user';
            }
            ret.phone = ret.phone || ret.phone_number || "";
            ret.shippingAddress = {
                province: ret.shippingAddress?.province || ret.city || "",
                district: ret.shippingAddress?.district || "",
                ward: ret.shippingAddress?.ward || "",
                detail: ret.shippingAddress?.detail || ret.address || "",
            };
            delete ret.phone_number;
            delete ret.name;
            delete ret.isAdmin;
            return ret;
        }
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    try {
        // Handle hashed_password field (new)
        if (this.isModified('hashed_password') && this.hashed_password) {
            // Check if password is already hashed (starts with $2a$ or $2b$)
            const isAlreadyHashed = /^\$2[aby]\$/.test(this.hashed_password);
            if (!isAlreadyHashed) {
                const hashedPassword = await bcrypt.hash(this.hashed_password, 12);
                this.hashed_password = hashedPassword;
            }
        }

        // Handle password field (old) - migrate to hashed_password
        if (this.isModified('password') && this.password) {
            // Check if password is already hashed
            const isAlreadyHashed = /^\$2[aby]\$/.test(this.password);
            if (!isAlreadyHashed) {
                const hashedPassword = await bcrypt.hash(this.password, 12);
                this.hashed_password = hashedPassword;
            } else {
                this.hashed_password = this.password;
            }
            this.password = undefined; // Remove old field
        }

        // Migrate name to full_name
        if (this.name && !this.full_name) {
            this.full_name = this.name;
            this.name = undefined;
        }

        // Migrate isAdmin to role
        if (typeof this.isAdmin === 'boolean' && !this.role) {
            this.role = this.isAdmin ? 'admin' : 'user';
            this.isAdmin = undefined;
        }

        // Synchronize phone and phone_number fields
        if (this.isModified('phone')) {
            this.phone_number = this.phone;
        }
        if (this.isModified('phone_number') && !this.isModified('phone')) {
            this.phone = this.phone_number;
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
    // Support both old 'password' field and new 'hashed_password' field for backward compatibility
    const hashedPassword = this.hashed_password || this.password;
    if (!hashedPassword) {
        throw new Error('No password found for user');
    }
    return await bcrypt.compare(candidatePassword, hashedPassword);
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to create admin user
userSchema.statics.createAdmin = async function (adminData) {
    const existingAdmin = await this.findOne({ email: adminData.email });
    if (existingAdmin) {
        return existingAdmin;
    }

    const admin = new this({
        ...adminData,
        role: 'admin'
    });

    return await admin.save();
};

// Instance method to check if user is admin
userSchema.methods.checkIsAdmin = function () {
    // Support both new role field and old isAdmin field
    if (this.role) {
        return this.role === 'admin';
    }
    return this.isAdmin === true;
};

// Instance method to add product to wishlist
userSchema.methods.addToWishlist = function (productId) {
    if (!this.wishlist.includes(productId)) {
        this.wishlist.push(productId);
    }
    return this.save();
};

// Instance method to remove product from wishlist
userSchema.methods.removeFromWishlist = function (productId) {
    this.wishlist = this.wishlist.filter(id => !id.equals(productId));
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
