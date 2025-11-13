const express = require('express');
const { body } = require('express-validator');
const {
    sendMessage,
    getUserConversation,
    getUnreadCount,
    markMessagesAsRead,
    deleteConversation,
    getAllConversations,
    getAdminConversation,
    sendAdminMessage,
    getMessageStats
} = require('../controllers/messageController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Validation rules for sending message
const sendMessageValidation = [
    body('receiver_id')
        .isMongoId()
        .withMessage('ID người nhận không hợp lệ'),
    body('content')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Nội dung tin nhắn phải có từ 1-1000 ký tự'),
    body('message_type')
        .optional()
        .isIn(['text', 'image', 'file'])
        .withMessage('Loại tin nhắn không hợp lệ'),
    body('attachment_url')
        .optional()
        .isURL()
        .withMessage('URL đính kèm không hợp lệ')
];

// Validation rules for marking messages as read
const markReadValidation = [
    body('sender_id')
        .isMongoId()
        .withMessage('ID người gửi không hợp lệ')
];

// User routes (require authentication)
router.post('/', auth, sendMessageValidation, sendMessage);
router.get('/conversation', auth, getUserConversation);
router.get('/unread-count', auth, getUnreadCount);
router.patch('/mark-read', auth, markReadValidation, markMessagesAsRead);
router.delete('/conversation/:userId', auth, deleteConversation);

// Admin routes (require admin privileges)
router.get('/admin/conversations', auth, adminAuth, getAllConversations);
router.get('/admin/conversation/:userId', auth, adminAuth, getAdminConversation);
router.post('/admin/send', auth, adminAuth, sendMessageValidation, sendAdminMessage);
router.get('/admin/stats', auth, adminAuth, getMessageStats);

module.exports = router;
