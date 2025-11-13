const mongoose = require('mongoose');

const productViewSchema = new mongoose.Schema({
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
    viewed_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    session_id: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Compound index để tránh duplicate và tăng performance
productViewSchema.index({ user: 1, product: 1 });
productViewSchema.index({ viewed_at: -1 });

module.exports = mongoose.model('ProductView', productViewSchema);
