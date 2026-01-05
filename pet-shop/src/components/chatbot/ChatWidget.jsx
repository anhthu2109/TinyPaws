import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaPaperPlane, FaComments, FaTimes, FaUser, FaBroom } from "react-icons/fa";
import "./style.css";
import { CONFIG } from "../../constants/config";
import { useAuth } from "../../context/AuthContext";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [showSupportButton, setShowSupportButton] = useState(false);
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('chat_mode') || 'bot';
  });

  const [adminInfo, setAdminInfo] = useState(() => {
    const saved = localStorage.getItem('chat_admin_info');
    return saved ? JSON.parse(saved) : null;
  });

  const [lastMessageTime, setLastMessageTime] = useState(Date.now());
  const [showInactiveWarning, setShowInactiveWarning] = useState(false);

  const makeLocalMessage = (message) => ({
    ...message,
    createdAt: message.createdAt || new Date().toISOString(),
    messageId:
      message.messageId || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  });

  const buildMessageKey = (message, fallbackSuffix = "0") => {
    if (message.messageId) return message.messageId;
    if (message.createdAt) return `${message.sender}-${message.createdAt}`;
    return `${message.sender}-${message.text}-${fallbackSuffix}`;
  };

  const mergeMessageLists = (currentMessages, incomingMessages) => {
    const mergedMap = new Map();

    currentMessages.forEach((msg, idx) => {
      mergedMap.set(buildMessageKey(msg, `current-${idx}`), msg);
    });

    const isLocalMessage = (msg) =>
      typeof msg?.messageId === "string" && msg.messageId.startsWith("local-");

    const findMatchingLocalKey = (incomingMsg) => {
      const incomingTime = incomingMsg.createdAt
        ? new Date(incomingMsg.createdAt).getTime()
        : null;

      for (const [key, value] of mergedMap.entries()) {
        if (!isLocalMessage(value)) continue;
        if (value.sender !== incomingMsg.sender) continue;
        if ((value.text || "").trim() !== (incomingMsg.text || "").trim()) continue;

        if (incomingTime && value.createdAt) {
          const localTime = new Date(value.createdAt).getTime();
          if (Math.abs(incomingTime - localTime) > 5000) continue;
        }

        return key;
      }
      return null;
    };

    incomingMessages.forEach((msg, idx) => {
      let key = buildMessageKey(msg, `incoming-${idx}`);

      if (!isLocalMessage(msg)) {
        const duplicateKey = findMatchingLocalKey(msg);
        if (duplicateKey) {
          key = duplicateKey;
        }
      }

      mergedMap.set(key, msg);
    });

    const merged = Array.from(mergedMap.values());
    merged.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });

    return merged;
  };

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const navigate = useNavigate();
  const { token, isAuthenticated, user } = useAuth(); // ⭐ Lấy user object

  const API_BASE_URL = CONFIG.API.BASE_URL;
  const CHAT_SEND_URL = `${API_BASE_URL}/api/chat/send`;
  const CHAT_HISTORY_URL = `${API_BASE_URL}/api/chat/history`;
  const REQUEST_SUPPORT_URL = `${API_BASE_URL}/api/chat/request-support`;
  const MESSAGE_SEND_URL = `${API_BASE_URL}/api/messages`;
  const CLEAR_HISTORY_URL = `${API_BASE_URL}/api/chat/clear-history`;


  // Khi mở popup chat: nếu đã đăng nhập và chưa load lịch sử thì gọi API history
  useEffect(() => {
    if (isOpen && isAuthenticated && !initialLoaded) {
      loadHistory();
    }
    if (isOpen && !isAuthenticated) {
      // Gợi ý đăng nhập nếu user chưa đăng nhập
      setMessages([
        makeLocalMessage({
          sender: "bot",
          text: "Bạn cần đăng nhập để sử dụng trợ lý TinyPaws 🐾. Vui lòng đăng nhập trước nhé.",
        }),
      ]);
    }
  }, [isOpen, isAuthenticated]);

  //Tự động tải tin nhắn mới mỗi 3 giây
  useEffect(() => {
    let interval;

    if (isOpen && isAuthenticated) {
      interval = setInterval(() => {
        fetchLatestMessages();
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [isOpen, isAuthenticated]);

  // ⭐ FIX 1: Helper function để map sender CHÍNH XÁC
  const mapSender = (message) => {
    const currentUserId = user?._id?.toString();

    // 1. Kiểm tra Bot
    if (message.is_bot === true) {
      return "bot";
    }

    // 2. Kiểm tra User (so sánh ID chính xác)
    const senderId = message.sender_info?._id?.toString() || message.sender?.toString();
    if (senderId === currentUserId) {
      return "user";
    }

    // 3. Kiểm tra Admin (dựa vào role)
    if (message.sender_info?.role === "admin") {
      return "admin";
    }

    // 4. Tin nhắn hệ thống
    if (message.intent === 'system' || message.sender === 'system') {
      return "system";
    }

    return "user"; // Default fallback
  };

  const fetchLatestMessages = async () => {
    try {
      const res = await axios.get(CHAT_HISTORY_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data?.data || {};
      if (data.session_id) setSessionId(data.session_id);

      const historyMessages = Array.isArray(data.messages) ? data.messages : [];

      if (historyMessages.length > 0) {
        const sortedMessages = historyMessages.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const mapped = sortedMessages.map((m) => ({
          sender: mapSender(m),
          text: m.content || "",
          meta: m.meta || {},
          fallback: m.meta?.fallback || false,
          createdAt: m.createdAt,
          messageId: m.id || m._id,
          sender_info: m.sender_info
        }));

        setMessages((prev) => mergeMessageLists(prev, mapped));

        // ⭐ LOGIC ĐƠN GIẢN: Chỉ cập nhật thời gian, KHÔNG đụng showSupportButton
        if (sortedMessages.length > 0) {
          setLastMessageTime(Date.now());
          setShowInactiveWarning(false);
        }
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!isAuthenticated) {
      navigate("/dang-nhap");
      return;
    }

    const userMessage = input.trim();
    setMessages((prev) => [...prev, makeLocalMessage({ sender: "user", text: userMessage })]);
    setInput("");
    setLoading(true);

    // ⭐ ẨN NÚT KHI USER GỬI TIN NHẮN MỚI
    setShowSupportButton(false);

    setLastMessageTime(Date.now());
    setShowInactiveWarning(false);

    try {
      if (mode === "bot") {
        const payload = { message: userMessage };
        if (sessionId) {
          payload.session_id = sessionId;
        }

        const res = await axios.post(CHAT_SEND_URL, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = res.data || {};
        const reply = data.reply || data.response;
        const sid = data.session_id;
        const fallback = data.fallback || false;
        const products = data.products || [];

        if (sid && sid !== sessionId) {
          setSessionId(sid);
        }

        const botReply = reply || "Xin lỗi 😿, chatbot đang gặp sự cố.";
        const botMessage = makeLocalMessage({
          sender: "bot",
          text: botReply,
          fallback,
          products,
        });

        setMessages((prev) => [...prev, botMessage]);

        // ⭐ HIỆN NÚT KHI BOT TRẢ LỜI VÀ CÓ FALLBACK
        if (fallback === true) {
          setShowSupportButton(true);
        }
      } else {
        const res = await axios.post(
          MESSAGE_SEND_URL,
          {
            receiver_id: adminInfo._id,
            content: userMessage,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.data.success) {
          setMessages((prev) => [
            ...prev,
            makeLocalMessage({ sender: "bot", text: "Không thể gửi tin nhắn đến nhân viên." }),
          ]);
        }
      }
    } catch (error) {
      console.error("Error sending chat message:", error);
      setMessages((prev) => [
        ...prev,
        makeLocalMessage({ sender: "bot", text: "Xin lỗi 😿, chatbot đang gặp sự cố." }),
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ handleRequestSupport - ẨN NÚT KHI CHUYỂN SANG HUMAN
  const handleRequestSupport = async () => {
    setLoading(true);
    setShowSupportButton(false); // ⭐ Ẩn nút ngay lập tức

    try {
      const res = await axios.post(
        REQUEST_SUPPORT_URL,
        {
          bot_session_id: sessionId,
          last_message: messages[messages.length - 1]?.text || "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        const { admin_session_id, admin_info } = res.data.data;

        setSessionId(admin_session_id);
        setMode("human");
        setAdminInfo(admin_info);

        localStorage.setItem('chat_mode', 'human');
        localStorage.setItem('chat_admin_info', JSON.stringify(admin_info));

        setMessages((prev) => [
          ...prev,
          makeLocalMessage({
            sender: "system",
            text: `🙋 Đã kết nối với ${admin_info.full_name}. Bạn có thể nhắn tin trực tiếp ngay bây giờ!`,
          }),
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        makeLocalMessage({ sender: "bot", text: "Không thể kết nối với nhân viên hỗ trợ lúc này." }),
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ loadHistory - KIỂM TRA VÀ HIỆN NÚT KHI LOAD
  const loadHistory = async () => {
    try {
      setLoading(true);

      const res = await axios.get(CHAT_HISTORY_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data?.data || {};
      const sid = data.session_id;
      const historyMessages = Array.isArray(data.messages) ? data.messages : [];

      if (sid) {
        setSessionId(sid);
      }

      if (historyMessages.length > 0) {
        const sortedMessages = historyMessages.sort((a, b) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        const mapped = sortedMessages.map((m) => ({
          sender: mapSender(m),
          text: m.content || "",
          meta: m.meta || {},
          fallback: m.meta?.fallback || false,
          createdAt: m.createdAt,
          messageId: m.id || m._id,
          sender_info: m.sender_info
        }));

        setMessages(mapped);

        // 🔥 Phát hiện mode từ lịch sử
        const hasAdminMessage = mapped.some(msg => msg.sender === "admin");

        if (hasAdminMessage) {
          setMode("human");
          localStorage.setItem('chat_mode', 'human');

          const adminMsg = sortedMessages.find(m => m.sender_info?.role === "admin");

          if (adminMsg?.sender_info) {
            const adminData = {
              _id: adminMsg.sender_info._id,
              full_name: adminMsg.sender_info.full_name,
              avatar: adminMsg.sender_info.avatar
            };
            setAdminInfo(adminData);
            localStorage.setItem('chat_admin_info', JSON.stringify(adminData));
          }
        } else {
          setMode("bot");
          localStorage.setItem('chat_mode', 'bot');
          setAdminInfo(null);
          localStorage.removeItem('chat_admin_info');

          // ⭐ KIỂM TRA TIN NHẮN CUỐI CÓ FALLBACK KHÔNG
          const lastMsg = mapped[mapped.length - 1];
          if (lastMsg?.sender === "bot" && lastMsg?.fallback === true) {
            setShowSupportButton(true);
          }
        }
      } else {
        setMessages([
          makeLocalMessage({
            sender: "bot",
            text: "Xin chào! Tôi là trợ lý TinyPaws 🐾. Bạn muốn hỏi gì về thú cưng hôm nay?",
          }),
        ]);
        setMode("bot");
        localStorage.setItem('chat_mode', 'bot');
        setAdminInfo(null);
        localStorage.removeItem('chat_admin_info');
      }
    } catch (error) {
      console.error("❌ Error loading chat history:", error);
      setMessages([
        makeLocalMessage({
          sender: "bot",
          text: "Xin chào! Tôi là trợ lý TinyPaws 🐾. Bạn muốn hỏi gì về thú cưng hôm nay?",
        }),
      ]);
      setMode("bot");
      localStorage.setItem('chat_mode', 'bot');
      setAdminInfo(null);
      localStorage.removeItem('chat_admin_info');
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  };

  const handleClearHistory = async () => {
    try {
      await axios.delete(CLEAR_HISTORY_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ⭐ Reset state VÀ localStorage
      setMessages([
        makeLocalMessage({
          sender: "bot",
          text: "Xin chào! Tôi là trợ lý TinyPaws. Bạn muốn hỏi gì về thú cưng hôm nay?",
        }),
      ]);
      setSessionId(null);
      setMode("bot");
      setAdminInfo(null);
      setShowInactiveWarning(false);

      // ⭐ Xóa localStorage
      localStorage.setItem('chat_mode', 'bot'); // Reset về bot
      localStorage.removeItem('chat_admin_info');

      // ⭐ Force reload để đồng bộ UI
      setInitialLoaded(false);
    } catch (error) {
      console.error("Lỗi xóa lịch sử:", error);
    }
  };

  // ⭐ FIX: Hàm kết thúc hỗ trợ - CHỈ CHUYỂN MODE, KHÔNG XÓA TIN NHẮN
  const handleEndSupport = async () => {
    try {
      // ⭐ KHÔNG XÓA LỊCH SỬ - Chỉ chuyển mode
      setMode("bot");
      setAdminInfo(null);
      setShowInactiveWarning(false);

      // Lưu localStorage
      localStorage.setItem('chat_mode', 'bot');
      localStorage.removeItem('chat_admin_info');

      // Thêm tin nhắn thông báo
      setMessages((prev) => [
        ...prev,
        makeLocalMessage({
          sender: "system",
          text: "✅ Đã kết thúc hỗ trợ. Bạn có thể tiếp tục chat với trợ lý AI TinyPaws!",
        }),
      ]);
    } catch (error) {
      console.error("Lỗi kết thúc hỗ trợ:", error);
    }
  };

  // === Hàm format trả lời chatbot ===
  const formatBotReply = (text) => {
    if (!text) return "";

    let formatted = text
      .trim()
      // Làm đậm phần **...**
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Giữ nguyên dấu * ở đầu dòng (có thể là bullet)
      //.replace(/^\* /gm, "• ")
      // Xuống dòng kép thành đoạn mới
      .replace(/\n{2,}/g, "</p><p>")
      // Xuống dòng đơn thành <br>
      .replace(/\n/g, "<br>")
      // Bọc trong <p>
      .replace(/^/, "<p>")
      .replace(/$/, "</p>");

    return formatted;
  };

  // ⭐ THÊM: useEffect theo dõi 60s không hoạt động (chỉ ở mode human)
  useEffect(() => {
    if (mode !== 'human' || !isOpen) {
      setShowInactiveWarning(false);
      return;
    }

    const checkInactivity = setInterval(() => {
      const timeSinceLastMessage = Date.now() - lastMessageTime;

      if (timeSinceLastMessage > 60000) {
        setShowInactiveWarning(true);
      }
    }, 10000);

    return () => clearInterval(checkInactivity);
  }, [mode, isOpen, lastMessageTime]);

  return (
    <div className="chatbot-widget">
      {/* Chat Icon Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chatbot-bubble"
          aria-label="Open chat"
        >
          <FaComments size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`chatbot-window ${isOpen ? "chatbot-window-open" : ""}`}>
          {/* Header */}
          <div className={`chatbot-header ${mode === 'human' ? 'bg-gradient-to-r from-orange-500 to-red-500' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="chatbot-avatar">
                {mode === "bot" ? "🐾" : "👤"}
              </span>
              <div>
                <h3 className="font-semibold text-sm">
                  {mode === "bot"
                    ? "TinyPaws Assistant"
                    : adminInfo?.full_name || "Nhân viên hỗ trợ"}
                </h3>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${mode === 'bot' ? 'bg-green-400' : 'bg-yellow-300'}`}></span>
                  {mode === "bot" ? "Trợ lý AI" : "Hỗ trợ trực tiếp"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Nút chuyển đổi chế độ */}
              {mode === "bot" ? (
                <button
                  onClick={handleClearHistory}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                  title="Làm mới đoạn chat"
                >
                  <FaBroom size={16} />
                </button>
              ) : (
                <button
                  onClick={handleEndSupport}
                  className="px-3 py-1 text-xs font-bold text-orange-600 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-all"
                  title="Kết thúc hỗ trợ"
                >
                  Kết thúc
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="chatbot-close-btn p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              >
                <FaTimes size={18} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="chatbot-messages">
            {/* Cảnh báo 60s không hoạt động (Chỉ hiện ở mode Human) */}
            {showInactiveWarning && mode === "human" && (
              <div className="mx-4 my-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg animate-fade-in">
                <p className="text-sm text-yellow-800 text-center">
                  ⏰ Bạn đã không hoạt động 1 phút.
                  <br />
                  Nếu xong rồi, bạn có thể bấm{" "}
                  <button
                    onClick={handleEndSupport}
                    className="font-bold text-orange-600 underline hover:text-orange-800"
                  >
                    kết thúc
                  </button>{" "}
                  để quay lại với Bot nhé!
                </p>
              </div>
            )}

            {/* Danh sách tin nhắn */}
            {messages.map((msg, idx) => (
              <div key={msg.messageId || idx}>
                <div
                  className={`chatbot-message ${msg.sender === "user"
                    ? "chatbot-message-user"
                    : msg.sender === "admin" || msg.sender === "system"
                      ? "chatbot-message-admin"
                      : "chatbot-message-bot"
                    }`}
                >
                  {/* Avatar nhỏ cho Admin (Optional) */}
                  {(msg.sender === "admin" || msg.sender === "system") && (
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mr-1 text-xs border border-orange-200">
                      👤
                    </div>
                  )}

                  <div
                    className="chatbot-message-bubble"
                    dangerouslySetInnerHTML={{ __html: formatBotReply(msg.text) }}
                  />
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="chatbot-message chatbot-message-bot">
                <div className="chatbot-message-bubble">
                  <div className="chatbot-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}

            {/* ⭐ NÚT "LIÊN HỆ" - ĐIỀU KHIỂN BỞI showSupportButton STATE */}
            {showSupportButton && mode === "bot" && (
              <div className="chatbot-message chatbot-message-bot animate-fade-in">
                <button
                  onClick={handleRequestSupport}
                  className="chatbot-contact-btn flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-500 text-blue-600 rounded-full shadow-md hover:bg-blue-50 hover:shadow-lg transition-all font-medium text-sm"
                >
                  <FaUser />
                  Gặp nhân viên hỗ trợ
                </button>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="chatbot-input-container">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={
                mode === "bot"
                  ? "Hỏi về thú cưng..."
                  : "Nhắn tin cho nhân viên..."
              }
              className="chatbot-input"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="chatbot-send-btn"
            >
              <FaPaperPlane size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
