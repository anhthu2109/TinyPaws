const axios = require('axios');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');

// Helper để build URL gọi sang Python chatbot
function getChatbotUrl() {
    // Lưu ý: dùng 127.0.0.1 làm default để tránh case localhost -> ::1 (IPv6)
    const base = (process.env.CHATBOT_BASE_URL || process.env.CHATBOT_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');
    const path = process.env.CHATBOT_CHAT_PATH || '/chat';
    return `${base}${path}`;
}

// POST /api/chat/send
// Lưu message user, gọi Python, lưu message bot, trả reply + session_id
const sendChatMessage = async (req, res) => {
    try {
        const { message, session_id } = req.body || {};

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung tin nhắn là bắt buộc'
            });
        }

        const userId = req.user?._id;
        const sessionId = session_id || `bot_${new mongoose.Types.ObjectId().toString()}`;

        const existingMessages = await Message.find({ session_id: sessionId })
            .sort({ createdAt: 1 })
            .lean();

        const history = existingMessages.map(m => ({
            role: m.is_bot ? 'assistant' : 'user',
            content: m.content
        }));

        const payload = {
            session_id: sessionId,
            message,
            history
        };

        const chatbotUrl = getChatbotUrl();

        let pythonResponse;
        try {
            pythonResponse = await axios.post(chatbotUrl, payload, {
                timeout: 30000
            });
        } catch (err) {
            return res.status(502).json({
                success: false,
                message: 'Chatbot tạm thời không phản hồi'
            });
        }

        const data = pythonResponse.data || {};
        const reply = data.response || 'Xin lỗi, tôi chưa có câu trả lời phù hợp.';
        const intent = data.intent || 'general';
        const products = data.sources || [];
        const fallback = data.fallback || false;

        try {
            const botUser = await User.findOne({ role: 'bot' }).lean();

            if (userId && botUser) {
                const userMessage = new Message({
                    sender: userId,
                    receiver: botUser._id,
                    content: message,
                    message_type: 'text',
                    session_id: sessionId,
                    is_bot: false,
                    intent: 'general',
                    meta: {}
                });

                await userMessage.save();

                const botMessage = new Message({
                    sender: botUser._id,
                    receiver: userId,
                    content: reply,
                    message_type: 'text',
                    session_id: sessionId,
                    is_bot: true,
                    intent,
                    meta: {
                        products,
                        fallback
                    }
                });

                await botMessage.save();
            } else {
                if (!botUser) {
                    console.warn('⚠️ Bot user not found (role="bot"). Chat history will not be persisted.');
                }
                if (!userId) {
                    console.warn('⚠️ No authenticated user on /api/chat/send. Chat history will not be linked to a user.');
                }
            }
        } catch (err) {
            console.error('Error saving chat messages:', err.message || err);
        }

        return res.json({
            success: true,
            reply,
            session_id: sessionId,
            intent,
            products,
            fallback
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi xử lý chat',
            error: error.message
        });
    }
};

// GET /api/chat/history
// GET /api/chat/history
const getChatHistory = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // ⭐ CHỈ LẤY TIN NHẮN CHƯA BỊ SOFT DELETE
        const messages = await Message.find({
            $or: [
                {
                    sender: userId,
                    deleted_by_sender: { $ne: true } // ⭐ User gửi & chưa xóa
                },
                {
                    receiver: userId,
                    deleted_by_receiver: { $ne: true } // ⭐ User nhận & chưa xóa
                }
            ]
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('sender', 'full_name role avatar email')
            .populate('receiver', 'full_name role avatar email')
            .lean();

        const sortedMessages = messages.reverse();
        const lastMsg = sortedMessages[sortedMessages.length - 1];
        const currentSessionId = lastMsg?.session_id || new mongoose.Types.ObjectId().toString();

        const normalizedMessages = sortedMessages.map((m) => {
            let senderType = 'user';

            if (m.is_bot) {
                senderType = 'bot';
            } else if (m.sender?._id?.toString() === userId.toString()) {
                senderType = 'user';
            } else if (m.sender?.role === 'admin') {
                senderType = 'admin';
            }

            return {
                id: m._id,
                session_id: m.session_id,
                sender: senderType,
                content: m.content,
                createdAt: m.createdAt,
                is_bot: m.is_bot || false,
                fallback: m.meta?.fallback || false,
                sender_info: m.sender
            };
        });

        return res.json({
            success: true,
            data: {
                session_id: currentSessionId,
                messages: normalizedMessages
            }
        });

    } catch (error) {
        console.error('getChatHistory error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/chat/request-support
// Chuyển từ bot session sang admin session
const requestHumanSupport = async (req, res) => {
    try {
        const { bot_session_id, last_message } = req.body;
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác thực được người dùng'
            });
        }

        const adminUser = await User.findOne({ role: 'admin' }).lean();
        if (!adminUser) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy admin hỗ trợ'
            });
        }

        const adminSessionId = `admin_${new mongoose.Types.ObjectId().toString()}`;

        let contextMessages = [];
        if (bot_session_id) {
            const botMessages = await Message.find({ session_id: bot_session_id })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();
            contextMessages = botMessages.reverse();
        }

        const contextSummary = contextMessages.length > 0
            ? `📝 Ngữ cảnh từ Bot:\n${contextMessages.map(m =>
                `${m.is_bot ? '🤖 Bot' : '👤 User'}: ${m.content}`
            ).join('\n')}`
            : 'Khách hàng yêu cầu hỗ trợ trực tiếp.';

        const userMessage = new Message({
            sender: userId,
            receiver: adminUser._id,
            content: last_message || 'Tôi cần hỗ trợ từ nhân viên',
            message_type: 'text',
            session_id: adminSessionId,
            is_bot: false,
            intent: 'human_support',
            meta: {
                bot_session_id,
                context: contextSummary,
                requested_at: new Date()
            }
        });

        await userMessage.save();

        const systemMessage = new Message({
            sender: adminUser._id,
            receiver: userId,
            content: '🙋 Đã chuyển đến nhân viên hỗ trợ. Vui lòng đợi trong giây lát...',
            message_type: 'text',
            session_id: adminSessionId,
            is_bot: false,
            intent: 'system',
            meta: {
                is_system_message: true
            }
        });

        await systemMessage.save();

        return res.json({
            success: true,
            message: 'Đã chuyển sang hỗ trợ nhân viên',
            data: {
                admin_session_id: adminSessionId,
                admin_info: {
                    _id: adminUser._id,
                    full_name: adminUser.full_name,
                    avatar: adminUser.avatar
                }
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi chuyển hỗ trợ',
            error: error.message
        });
    }
};

// DELETE /api/chat/clear-history (Soft Delete)
const clearChatHistory = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác thực được người dùng'
            });
        }

        // ⭐ SOFT DELETE: Đánh dấu deleted
        const result = await Message.updateMany(
            {
                $or: [
                    { sender: userId },
                    { receiver: userId }
                ]
            },
            {
                $set: {
                    deleted_by_sender: true,
                    deleted_by_receiver: true
                }
            }
        );

        console.log(`✅ Đã ẩn ${result.modifiedCount} tin nhắn khỏi User (Admin vẫn thấy)`);

        return res.json({
            success: true,
            message: 'Đã xóa lịch sử chat',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message
        });
    }
};

module.exports = {
    sendChatMessage,
    getChatHistory,
    requestHumanSupport,
    clearChatHistory
};