const express = require('express');
const {
    sendChatMessage,
    getChatHistory,
    requestHumanSupport,
    clearChatHistory
} = require('../controllers/chatController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Bot chat endpoints
router.post('/send', auth, sendChatMessage);
router.get('/history', auth, getChatHistory);
router.post('/request-support', auth, requestHumanSupport);
router.delete('/clear-history', auth, clearChatHistory);

module.exports = router;
