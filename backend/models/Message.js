const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const messageSchema = new mongoose.Schema({
    sender: {
        type: ObjectId,
        ref: 'User',
        required: [true, 'Người gửi là bắt buộc']
    },
    receiver: {
        type: ObjectId,
        ref: 'User',
        required: [true, 'Người nhận là bắt buộc']
    },
    content: {
        type: String,
        trim: true,
        required: [true, 'Nội dung tin nhắn là bắt buộc'],
        maxlength: [1000, 'Nội dung tin nhắn không được quá 1000 ký tự']
    },
    is_read: {
        type: Boolean,
        default: false
    },
    message_type: {
        type: String,
        enum: {
            values: ['text', 'image', 'file'],
            message: 'Loại tin nhắn không hợp lệ'
        },
        default: 'text'
    },
    attachment_url: {
        type: String,
        validate: {
            validator: function(v) {
                // Only validate URL if message_type is not 'text'
                if (this.message_type !== 'text' && v) {
                    return /^https?:\/\/.+/.test(v);
                }
                return true;
            },
            message: 'URL đính kèm không hợp lệ'
        }
    },
    read_at: {
        type: Date
    },
    deleted_by_sender: {
        type: Boolean,
        default: false
    },
    deleted_by_receiver: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexing for better performance
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, is_read: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Virtual for formatted created time
messageSchema.virtual('formattedTime').get(function() {
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(this.createdAt);
});

// Virtual for time ago
messageSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) {
        return `${days} ngày trước`;
    } else if (hours > 0) {
        return `${hours} giờ trước`;
    } else if (minutes > 0) {
        return `${minutes} phút trước`;
    } else {
        return 'Vừa xong';
    }
});

// Virtual to check if message is deleted
messageSchema.virtual('isDeleted').get(function() {
    return this.deleted_by_sender && this.deleted_by_receiver;
});

// Pre-save middleware to set read_at when is_read changes to true
messageSchema.pre('save', function(next) {
    if (this.isModified('is_read') && this.is_read && !this.read_at) {
        this.read_at = new Date();
    }
    next();
});

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(userId1, userId2, options = {}) {
    const {
        page = 1,
        limit = 50,
        sortOrder = -1 // -1 for newest first, 1 for oldest first
    } = options;

    const skip = (page - 1) * limit;

    return this.find({
        $or: [
            { sender: userId1, receiver: userId2, deleted_by_sender: false },
            { sender: userId2, receiver: userId1, deleted_by_receiver: false }
        ]
    })
    .populate('sender', 'full_name avatar role')
    .populate('receiver', 'full_name avatar role')
    .sort({ createdAt: sortOrder })
    .skip(skip)
    .limit(limit);
};

// Static method to get all conversations for a user
messageSchema.statics.getUserConversations = function(userId) {
    return this.aggregate([
        {
            $match: {
                $or: [
                    { sender: new mongoose.Types.ObjectId(userId), deleted_by_sender: false },
                    { receiver: new mongoose.Types.ObjectId(userId), deleted_by_receiver: false }
                ]
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $group: {
                _id: {
                    $cond: [
                        { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
                        '$receiver',
                        '$sender'
                    ]
                },
                lastMessage: { $first: '$$ROOT' },
                unreadCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
                                    { $eq: ['$is_read', false] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'otherUser'
            }
        },
        {
            $unwind: '$otherUser'
        },
        {
            $project: {
                otherUser: {
                    _id: 1,
                    full_name: 1,
                    avatar: 1,
                    role: 1,
                    isAdmin: 1
                },
                lastMessage: {
                    _id: 1,
                    content: 1,
                    createdAt: 1,
                    is_read: 1,
                    message_type: 1,
                    sender: 1
                },
                unreadCount: 1
            }
        },
        {
            $sort: { 'lastMessage.createdAt': -1 }
        }
    ]);
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = function(senderId, receiverId) {
    return this.updateMany(
        {
            sender: senderId,
            receiver: receiverId,
            is_read: false
        },
        {
            $set: {
                is_read: true,
                read_at: new Date()
            }
        }
    );
};

// Static method to get unread message count for a user
messageSchema.statics.getUnreadCount = function(userId) {
    return this.countDocuments({
        receiver: userId,
        is_read: false,
        deleted_by_receiver: false
    });
};

// Static method to delete conversation (soft delete)
messageSchema.statics.deleteConversation = function(userId1, userId2, deletedBy) {
    const updateField = deletedBy.toString() === userId1.toString() 
        ? { deleted_by_sender: true }
        : { deleted_by_receiver: true };

    return this.updateMany(
        {
            $or: [
                { sender: userId1, receiver: userId2 },
                { sender: userId2, receiver: userId1 }
            ]
        },
        { $set: updateField }
    );
};

// Instance method to mark single message as read
messageSchema.methods.markAsRead = function() {
    this.is_read = true;
    this.read_at = new Date();
    return this.save();
};

// Instance method to soft delete message
messageSchema.methods.softDelete = function(deletedBy) {
    if (deletedBy.toString() === this.sender.toString()) {
        this.deleted_by_sender = true;
    } else if (deletedBy.toString() === this.receiver.toString()) {
        this.deleted_by_receiver = true;
    }
    return this.save();
};

// Instance method to check if user can see this message
messageSchema.methods.canUserSee = function(userId) {
    const userIdStr = userId.toString();
    const senderStr = this.sender.toString();
    const receiverStr = this.receiver.toString();
    
    if (userIdStr === senderStr && this.deleted_by_sender) {
        return false;
    }
    if (userIdStr === receiverStr && this.deleted_by_receiver) {
        return false;
    }
    
    return userIdStr === senderStr || userIdStr === receiverStr;
};

module.exports = mongoose.model('Message', messageSchema);
