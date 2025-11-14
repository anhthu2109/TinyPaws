import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FaPaperPlane, FaComments, FaTimes } from "react-icons/fa";
import "./style.css";
import { CONFIG } from "../../constants/config";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Xin chào! Tôi là trợ lý TinyPaws 🐾. Bạn muốn hỏi gì về thú cưng hôm nay?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_URL = CONFIG.API.CHATBOT.BASE + CONFIG.API.CHATBOT.CHAT;
  console.log("Chatbot API connect to:", API_URL);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(API_URL, { message: userMessage });
      const botReply = res.data.response;
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Xin lỗi 😿, chatbot đang gặp sự cố." }
      ]);
    } finally {
      setLoading(false);
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
        <div className={`chatbot-window ${isOpen ? 'chatbot-window-open' : ''}`}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="flex items-center gap-2">
              <span className="chatbot-avatar">🐾</span>
              <div>
                <h3 className="font-semibold text-sm">TinyPaws Assistant</h3>
                <p className="text-xs opacity-90">Trợ lý thú cưng AI</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="chatbot-close-btn"
              aria-label="Close chat"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chatbot-message ${msg.sender === "user" ? "chatbot-message-user" : "chatbot-message-bot"}`}
              >
                <div
  className="chatbot-message-bubble"
  dangerouslySetInnerHTML={{ __html: formatBotReply(msg.text) }}
/>
              </div>
            ))}
            {loading && (
              <div className="chatbot-message chatbot-message-bot">
                <div className="chatbot-message-bubble">
                  <div className="chatbot-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
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
              placeholder="Hỏi về thú cưng của bạn..."
              className="chatbot-input"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="chatbot-send-btn"
              aria-label="Send message"
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
