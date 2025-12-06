import { useState, useEffect, useRef } from 'react';
import { FaSearch, FaUser, FaPaperPlane, FaEllipsisV } from 'react-icons/fa';
import axios from 'axios';
import { CONFIG } from '../../constants/config';
import { useAuth } from '../../context/AuthContext';

const Chat = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [userHasSelected, setUserHasSelected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({});

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const { token } = useAuth();

    useEffect(() => {
        fetchConversations();
        fetchMessageStats();

        const intervalId = setInterval(() => {
            fetchConversations();
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        let intervalId = null;

        if (selectedUserId) {
            fetchMessages(selectedUserId);

            intervalId = setInterval(() => {
                fetchMessages(selectedUserId);
            }, 3000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [selectedUserId]);

    const fetchConversations = async () => {
        try {
            const response = await axios.get(
                `${CONFIG.API.BASE_URL}/api/messages/admin/conversations`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                const newConversations = response.data.data.conversations;

                const mappedConversations = newConversations.map(conv => ({
                    _id: conv._id,
                    otherUser: conv.otherUser,
                    lastMessage: conv.lastMessage,
                    unreadCount: conv.unreadCount
                }));

                setConversations(mappedConversations);

                // Chỉ tự động chọn khi user chưa từng tự chọn cuộc trò chuyện nào
                if (mappedConversations.length > 0 && !selectedUserId && !userHasSelected) {
                    setSelectedUserId(mappedConversations[0]._id);
                }
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            if (loading) setLoading(false);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const response = await axios.get(
                `${CONFIG.API.BASE_URL}/api/messages/admin/conversation/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                let incomingMessages = response.data.data.messages;

                incomingMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                
                setMessages(incomingMessages);
                await markAsRead(userId);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchMessageStats = async () => {
        try {
            const response = await axios.get(
                `${CONFIG.API.BASE_URL}/api/messages/admin/stats`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching message stats:', error);
        }
    };

    const markAsRead = async (userId) => {
        try {
            await axios.patch(
                `${CONFIG.API.BASE_URL}/api/messages/mark-read`,
                { sender_id: userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedUserId || sending) return;

        setSending(true);

        try {
            const response = await axios.post(
                `${CONFIG.API.BASE_URL}/api/messages/admin/send`,
                {
                    receiver_id: selectedUserId,
                    content: newMessage.trim()
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setNewMessage('');
                fetchMessages(selectedUserId);
                fetchConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (date) => {
        const today = new Date();
        const messageDate = new Date(date);

        if (messageDate.toDateString() === today.toDateString()) {
            return 'Hôm nay';
        } else if (messageDate.toDateString() === new Date(today.getTime() - 86400000).toDateString()) {
            return 'Hôm qua';
        } else {
            return messageDate.toLocaleDateString('vi-VN');
        }
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';

        const now = new Date();
        const messageDate = new Date(dateString);
        const diffTime = now - messageDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return messageDate.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } else if (diffDays === 1) {
            return 'Hôm qua';
        } else if (diffDays < 7) {
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            return days[messageDate.getDay()];
        } else {
            return messageDate.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit'
            });
        }
    };

    const filteredConversations = conversations.filter(conv =>
        conv.otherUser.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.otherUser.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getSelectedConversation = () => {
        return conversations.find(conv => conv._id === selectedUserId);
    };

    const selectedConversation = getSelectedConversation();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Tin nhắn khách hàng</h2>
                </div>
            </div>

            {/* Stats Cards
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Tổng tin nhắn</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.totalMessages || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                            <FaPaperPlane className="text-white text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Chưa đọc</p>
                            <p className="text-3xl font-bold text-red-600">{stats.unreadMessages || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                            <FaPaperPlane className="text-white text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Cuộc trò chuyện</p>
                            <p className="text-3xl font-bold text-green-600">{stats.totalConversations || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                            <FaUser className="text-white text-xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Hôm nay</p>
                            <p className="text-3xl font-bold text-purple-600">{stats.todayMessages || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                            <FaPaperPlane className="text-white text-xl" />
                        </div>
                    </div>
                </div>
            </div> */}

            {/* Chat Interface */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
                <div className="flex h-full">
                    {/* Conversations List */}
                    <div className="w-1/3 border-r border-gray-200 flex flex-col">
                        {/* Search */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm cuộc trò chuyện..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff5252] focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Conversations - ⭐ UPDATED UI */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ff5252]"></div>
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="flex items-center justify-center py-8 text-gray-500">
                                    Chưa có cuộc trò chuyện nào
                                </div>
                            ) : (
                                filteredConversations.map((conversation) => (
                                    <div
                                        key={conversation._id}
                                        onClick={() => {
                                            setSelectedUserId(conversation._id);
                                            setUserHasSelected(true);
                                        }}
                                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedUserId === conversation._id
                                            ? 'bg-blue-50 border-l-4 border-l-[#ff5252]'
                                            : ''
                                            }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                                                    <span className="text-base font-semibold text-white">
                                                        {conversation.otherUser.full_name?.charAt(0) || 'U'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Header: Name + Time */}
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {conversation.otherUser.full_name}
                                                    </p>
                                                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                                        {formatTimeAgo(conversation.lastMessage?.createdAt)}
                                                    </span>
                                                </div>

                                                {/* Last Message + Badge */}
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-gray-500 truncate flex-1">
                                                        {conversation.lastMessage?.content || 'Chưa có tin nhắn'}
                                                    </p>
                                                    {conversation.unreadCount > 0 && (
                                                        <span className="bg-[#ff5252] text-white text-xs rounded-full px-2 py-0.5 font-medium ml-2 flex-shrink-0">
                                                            {conversation.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {selectedConversation ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                                                <span className="text-base font-bold text-white">
                                                    {selectedConversation.otherUser.full_name?.charAt(0) || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {selectedConversation.otherUser.full_name}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {selectedConversation.otherUser.email}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                            <FaEllipsisV />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages - ⭐ REMOVED: auto-scroll logic */}
                                <div
                                    ref={messagesContainerRef}
                                    className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
                                >
                                    {messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-gray-500">
                                            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                                        </div>
                                    ) : (
                                        messages.map((message) => {
                                            const isFromUser = message.sender._id === selectedUserId;
                                            const isBot = message.is_bot;
                                            const isAdmin = !isBot && !isFromUser;

                                            return (
                                                <div
                                                    key={message._id}
                                                    className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`flex flex-col max-w-xs lg:max-w-md ${isAdmin ? 'items-end' : 'items-start'}`}>
                                                        {/* Label */}
                                                        {isBot && (
                                                            <span className="text-xs text-blue-600 font-medium mb-1 ml-2">
                                                                Bot
                                                            </span>
                                                        )}
                                                        {isFromUser && (
                                                            <span className="text-xs text-gray-500 mb-1 ml-2">
                                                                {selectedConversation.otherUser.full_name}
                                                            </span>
                                                        )}
                                                        {isAdmin && (
                                                            <span className="text-xs text-orange-600 font-medium mb-1 mr-2">
                                                                TinyPaws
                                                            </span>
                                                        )}

                                                        {/* Message Bubble */}
                                                        <div
                                                            className={`px-4 py-2.5 rounded-2xl shadow-sm ${isBot
                                                                ? 'bg-blue-500 text-white'
                                                                : isAdmin
                                                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                                                                    : 'bg-white text-gray-800 border border-gray-200'
                                                                }`}
                                                        >
                                                            <p className="text-sm leading-relaxed">{message.content}</p>
                                                            <p
                                                                className={`text-xs mt-1 ${isBot || isAdmin
                                                                    ? 'text-white/80'
                                                                    : 'text-gray-500'
                                                                    }`}
                                                            >
                                                                {formatTime(message.createdAt)}
                                                            </p>
                                                        </div>

                                                        {/* Context
                                                        {message.meta?.context && (
                                                            <div className="mt-2 p-2 bg-gray-100 rounded-lg text-xs text-gray-600 max-w-full">
                                                                <p className="font-medium text-gray-700 mb-1">📝 Ngữ cảnh:</p>
                                                                <p className="whitespace-pre-wrap">{message.meta.context}</p>
                                                            </div>
                                                        )} */}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t border-gray-200 bg-white">
                                    <div className="flex space-x-3">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Nhập tin nhắn..."
                                            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#ff5252] focus:border-transparent transition-all"
                                            rows="2"
                                            disabled={sending} // ⭐ Disable khi đang gửi
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim() || sending} // ⭐ Disable khi rỗng hoặc đang gửi
                                            className={`px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${!newMessage.trim() || sending
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-[#ff5252] to-[#ff7052] text-white hover:from-[#e53e3e] hover:to-[#e65f3e] shadow-md hover:shadow-lg'
                                                }`}
                                        >
                                            {sending ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                    Đang gửi...
                                                </>
                                            ) : (
                                                <>
                                                    <FaPaperPlane />
                                                    Gửi
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <FaUser className="text-white text-3xl" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Chọn cuộc trò chuyện</h3>
                                    <p className="text-sm text-gray-500">
                                        Chọn một khách hàng bên trái để bắt đầu nhắn tin
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
