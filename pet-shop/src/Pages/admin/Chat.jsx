import { useState, useEffect } from 'react';
import { FaSearch, FaUser, FaPaperPlane, FaEllipsisV } from 'react-icons/fa';
import axios from 'axios';
import { CONFIG } from '../../constants/config';

const Chat = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({});

    useEffect(() => {
        fetchConversations();
        fetchMessageStats();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation._id);
        }
    }, [selectedConversation]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${CONFIG.API.BASE_URL}/api/messages/admin/conversations`);
            
            if (response.data.success) {
                setConversations(response.data.data.conversations);
                if (response.data.data.conversations.length > 0 && !selectedConversation) {
                    setSelectedConversation(response.data.data.conversations[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const response = await axios.get(`${CONFIG.API.BASE_URL}/api/messages/admin/conversation/${userId}`);
            
            if (response.data.success) {
                setMessages(response.data.data.messages);
                // Mark messages as read
                await markAsRead(userId);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchMessageStats = async () => {
        try {
            const response = await axios.get(`${CONFIG.API.BASE_URL}/api/messages/admin/stats`);
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching message stats:', error);
        }
    };

    const markAsRead = async (userId) => {
        try {
            await axios.patch(`${CONFIG.API.BASE_URL}/api/messages/mark-read`, {
                senderId: userId
            });
            // Refresh conversations to update unread count
            fetchConversations();
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            const response = await axios.post(`${CONFIG.API.BASE_URL}/api/messages/admin/send`, {
                receiverId: selectedConversation._id,
                content: newMessage.trim()
            });

            if (response.data.success) {
                setNewMessage('');
                fetchMessages(selectedConversation._id);
                fetchConversations(); // Refresh conversations
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Có lỗi xảy ra khi gửi tin nhắn');
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

    const filteredConversations = conversations.filter(conv =>
        conv.otherUser.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.otherUser.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Tin nhắn khách hàng</h2>
                    <p className="text-gray-600 mt-2">Quản lý và trả lời tin nhắn từ khách hàng</p>
                </div>
            </div>

            {/* Stats Cards */}
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
            </div>

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

                        {/* Conversations */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ff5252]"></div>
                                </div>
                            ) : (
                                filteredConversations.map((conversation) => (
                                    <div
                                        key={conversation._id}
                                        onClick={() => setSelectedConversation(conversation)}
                                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                                            selectedConversation?._id === conversation._id ? 'bg-blue-50 border-l-4 border-l-[#ff5252]' : ''
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {conversation.otherUser.full_name?.charAt(0) || 'U'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {conversation.otherUser.full_name}
                                                    </p>
                                                    {conversation.unreadCount > 0 && (
                                                        <span className="bg-[#ff5252] text-white text-xs rounded-full px-2 py-1">
                                                            {conversation.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {conversation.lastMessage?.content || 'Chưa có tin nhắn'}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {conversation.lastMessage?.createdAt && formatDate(conversation.lastMessage.createdAt)}
                                                </p>
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
                                <div className="p-4 border-b border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {selectedConversation.otherUser.full_name?.charAt(0) || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {selectedConversation.otherUser.full_name}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {selectedConversation.otherUser.email}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="p-2 text-gray-400 hover:text-gray-600">
                                            <FaEllipsisV />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message._id}
                                            className={`flex ${
                                                message.sender._id === selectedConversation._id ? 'justify-start' : 'justify-end'
                                            }`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                    message.sender._id === selectedConversation._id
                                                        ? 'bg-gray-200 text-gray-800'
                                                        : 'bg-[#ff5252] text-white'
                                                }`}
                                            >
                                                <p className="text-sm">{message.content}</p>
                                                <p className={`text-xs mt-1 ${
                                                    message.sender._id === selectedConversation._id
                                                        ? 'text-gray-500'
                                                        : 'text-red-100'
                                                }`}>
                                                    {formatTime(message.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t border-gray-200">
                                    <div className="flex space-x-3">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Nhập tin nhắn..."
                                            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#ff5252] focus:border-transparent"
                                            rows="2"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim()}
                                            className="px-4 py-2 bg-[#ff5252] text-white rounded-lg hover:bg-[#e53e3e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <FaPaperPlane />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <FaUser className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Chọn cuộc trò chuyện</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Chọn một cuộc trò chuyện để bắt đầu nhắn tin
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
