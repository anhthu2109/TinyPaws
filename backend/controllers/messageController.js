const Message = require('../models/Message');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Send a new message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { receiver_id, content, message_type = 'text', attachment_url } = req.body;

        // Check if receiver exists
        const receiver = await User.findById(receiver_id);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: 'Người nhận không tồn tại'
            });
        }

        // Prevent users from sending messages to themselves
        if (req.user._id.toString() === receiver_id) {
            return res.status(400).json({
                success: false,
                message: 'Không thể gửi tin nhắn cho chính mình'
            });
        }

        // Create message
        const message = new Message({
            sender: req.user._id,
            receiver: receiver_id,
            content,
            message_type,
            attachment_url
        });

        await message.save();
        await message.populate('sender', 'full_name avatar role');
        await message.populate('receiver', 'full_name avatar role');

        res.status(201).json({
            success: true,
            message: 'Gửi tin nhắn thành công',
            data: {
                message
            }
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get user's conversation history
// @route   GET /api/messages/conversation
// @access  Private
const getUserConversation = async (req, res) => {
    try {
        const {
            with_user,
            page = 1,
            limit = 50,
            sort_order = 'desc'
        } = req.query;

        // If with_user is specified, get conversation with that user
        if (with_user) {
            const otherUser = await User.findById(with_user);
            if (!otherUser) {
                return res.status(404).json({
                    success: false,
                    message: 'Người dùng không tồn tại'
                });
            }

            const messages = await Message.getConversation(
                req.user._id,
                with_user,
                {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    sortOrder: sort_order === 'asc' ? 1 : -1
                }
            );

            // Mark messages as read (messages sent to current user)
            await Message.markAsRead(with_user, req.user._id);

            const totalMessages = await Message.countDocuments({
                $or: [
                    { sender: req.user._id, receiver: with_user, deleted_by_sender: false },
                    { sender: with_user, receiver: req.user._id, deleted_by_receiver: false }
                ]
            });

            const totalPages = Math.ceil(totalMessages / parseInt(limit));

            return res.json({
                success: true,
                data: {
                    messages,
                    otherUser: {
                        _id: otherUser._id,
                        full_name: otherUser.full_name,
                        avatar: otherUser.avatar,
                        role: otherUser.role
                    },
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages,
                        totalMessages,
                        hasNextPage: parseInt(page) < totalPages,
                        hasPrevPage: parseInt(page) > 1
                    }
                }
            });
        }

        // If no specific user, get all conversations
        const conversations = await Message.getUserConversations(req.user._id);

        res.json({
            success: true,
            data: {
                conversations
            }
        });
    } catch (error) {
        console.error('Get user conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
    try {
        const unreadCount = await Message.getUnreadCount(req.user._id);

        res.json({
            success: true,
            data: {
                unreadCount
            }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Mark messages as read
// @route   PATCH /api/messages/mark-read
// @access  Private
const markMessagesAsRead = async (req, res) => {
    try {
        const { sender_id } = req.body;

        if (!sender_id) {
            return res.status(400).json({
                success: false,
                message: 'ID người gửi là bắt buộc'
            });
        }

        await Message.markAsRead(sender_id, req.user._id);

        res.json({
            success: true,
            message: 'Đã đánh dấu tin nhắn là đã đọc'
        });
    } catch (error) {
        console.error('Mark messages as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Delete conversation
// @route   DELETE /api/messages/conversation/:userId
// @access  Private
const deleteConversation = async (req, res) => {
    try {
        const { userId } = req.params;

        const otherUser = await User.findById(userId);
        if (!otherUser) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        await Message.deleteConversation(req.user._id, userId, req.user._id);

        res.json({
            success: true,
            message: 'Đã xóa cuộc trò chuyện'
        });
    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get all conversations (Admin only)
// @route   GET /api/admin/messages/conversations
// @access  Private/Admin
const getAllConversations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search
        } = req.query;

        // Get all users who have sent messages
        const pipeline = [
            {
                $group: {
                    _id: {
                        user1: { $min: ['$sender', '$receiver'] },
                        user2: { $max: ['$sender', '$receiver'] }
                    },
                    lastMessage: { $last: '$$ROOT' },
                    messageCount: { $sum: 1 },
                    unreadCount: {
                        $sum: {
                            $cond: [{ $eq: ['$is_read', false] }, 1, 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id.user1',
                    foreignField: '_id',
                    as: 'user1'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id.user2',
                    foreignField: '_id',
                    as: 'user2'
                }
            },
            {
                $unwind: '$user1'
            },
            {
                $unwind: '$user2'
            },
            {
                $project: {
                    user1: {
                        _id: 1,
                        full_name: 1,
                        email: 1,
                        avatar: 1,
                        role: 1
                    },
                    user2: {
                        _id: 1,
                        full_name: 1,
                        email: 1,
                        avatar: 1,
                        role: 1
                    },
                    lastMessage: {
                        _id: 1,
                        content: 1,
                        createdAt: 1,
                        is_read: 1,
                        message_type: 1
                    },
                    messageCount: 1,
                    unreadCount: 1
                }
            },
            {
                $sort: { 'lastMessage.createdAt': -1 }
            }
        ];

        // Add search filter if provided
        if (search) {
            pipeline.unshift({
                $match: {
                    $or: [
                        { 'sender.full_name': { $regex: search, $options: 'i' } },
                        { 'receiver.full_name': { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        const conversations = await Message.aggregate(pipeline)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalConversations = await Message.aggregate([
            ...pipeline.slice(0, -1),
            { $count: 'total' }
        ]);

        const total = totalConversations[0]?.total || 0;
        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            success: true,
            data: {
                conversations,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalConversations: total,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error('Get all conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get conversation with specific user (Admin only)
// @route   GET /api/admin/messages/conversation/:userId
// @access  Private/Admin
const getAdminConversation = async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            page = 1,
            limit = 50,
            sort_order = 'desc'
        } = req.query;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        const messages = await Message.getConversation(
            req.user._id,
            userId,
            {
                page: parseInt(page),
                limit: parseInt(limit),
                sortOrder: sort_order === 'asc' ? 1 : -1
            }
        );

        // Mark messages as read (messages sent to admin)
        await Message.markAsRead(userId, req.user._id);

        const totalMessages = await Message.countDocuments({
            $or: [
                { sender: req.user._id, receiver: userId, deleted_by_sender: false },
                { sender: userId, receiver: req.user._id, deleted_by_receiver: false }
            ]
        });

        const totalPages = Math.ceil(totalMessages / parseInt(limit));

        res.json({
            success: true,
            data: {
                messages,
                user: {
                    _id: user._id,
                    full_name: user.full_name,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalMessages,
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error('Get admin conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Send admin message
// @route   POST /api/admin/messages
// @access  Private/Admin
const sendAdminMessage = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }

        const { receiver_id, content, message_type = 'text', attachment_url } = req.body;

        // Check if receiver exists
        const receiver = await User.findById(receiver_id);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: 'Người nhận không tồn tại'
            });
        }

        // Create message
        const message = new Message({
            sender: req.user._id,
            receiver: receiver_id,
            content,
            message_type,
            attachment_url
        });

        await message.save();
        await message.populate('sender', 'full_name avatar role');
        await message.populate('receiver', 'full_name avatar role');

        res.status(201).json({
            success: true,
            message: 'Gửi tin nhắn thành công',
            data: {
                message
            }
        });
    } catch (error) {
        console.error('Send admin message error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

// @desc    Get message statistics (Admin only)
// @route   GET /api/admin/messages/stats
// @access  Private/Admin
const getMessageStats = async (req, res) => {
    try {
        const stats = await Message.aggregate([
            {
                $group: {
                    _id: null,
                    totalMessages: { $sum: 1 },
                    unreadMessages: {
                        $sum: { $cond: [{ $eq: ['$is_read', false] }, 1, 0] }
                    },
                    todayMessages: {
                        $sum: {
                            $cond: [
                                {
                                    $gte: [
                                        '$createdAt',
                                        new Date(new Date().setHours(0, 0, 0, 0))
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const uniqueConversations = await Message.aggregate([
            {
                $group: {
                    _id: {
                        user1: { $min: ['$sender', '$receiver'] },
                        user2: { $max: ['$sender', '$receiver'] }
                    }
                }
            },
            {
                $count: 'totalConversations'
            }
        ]);

        const result = {
            totalMessages: stats[0]?.totalMessages || 0,
            unreadMessages: stats[0]?.unreadMessages || 0,
            todayMessages: stats[0]?.todayMessages || 0,
            totalConversations: uniqueConversations[0]?.totalConversations || 0
        };

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get message stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = {
    sendMessage,
    getUserConversation,
    getUnreadCount,
    markMessagesAsRead,
    deleteConversation,
    getAllConversations,
    getAdminConversation,
    sendAdminMessage,
    getMessageStats
};
