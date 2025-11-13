const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    added_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'removed', 'purchased'],
        default: 'active',
        index: true
    },
    removed_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound index để tránh duplicate
cartSchema.index({ user: 1, product: 1 }, { unique: true });
cartSchema.index({ status: 1, added_at: -1 });

module.exports = mongoose.model('Cart', cartSchema);
