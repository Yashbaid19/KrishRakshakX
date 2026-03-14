import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QUICK_SUGGESTIONS = [
  "What crop should I grow?",
  "Why are my leaves turning yellow?",
  "How to improve soil fertility?",
  "How to use this platform?"
];

export default function Chatbot({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/chat/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load chat history", error);
    }
  };

  const sendMessage = async (messageText = null) => {
    const userMessage = messageText || input.trim();
    if (!userMessage) return;

    setInput("");
    setLoading(true);

    // Add user message optimistically to UI
    const tempUserMsg = {
      role: "user",
      message: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API}/chat`,
        { message: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add AI response to UI
      const aiMsg = {
        role: "assistant",
        message: response.data.response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message
      const errorMsg = {
        role: "assistant",
        message: "AI assistant temporarily unavailable. Please try again later.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-emerald-100 flex flex-col z-50">
      {/* Header */}
      <div className="bg-primary text-white p-4 rounded-t-2xl flex justify-between items-center">
        <h3 className="font-bold text-lg">KrishiRakshak AI Assistant</h3>
        <button
          data-testid="chatbot-close-button"
          onClick={onClose}
          className="hover:bg-white/20 p-1 rounded-lg transition-colors duration-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-4">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
            <p className="font-medium">Ask me anything about farming!</p>
            <div className="grid grid-cols-1 gap-2 mt-4">
              {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  data-testid={`quick-suggestion-${idx}`}
                  onClick={() => sendMessage(suggestion)}
                  className="text-xs text-left p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors duration-200"
                  disabled={loading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-none"
                  : "bg-emerald-50 text-gray-800 rounded-bl-none"
              }`}
            >
              <p className="text-sm">{msg.message}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-emerald-50 text-gray-800 p-3 rounded-2xl rounded-bl-none">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-emerald-100">
        <div className="flex gap-2">
          <Input
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 rounded-full border-emerald-200 focus:ring-2 focus:ring-emerald-500"
            disabled={loading}
          />
          <Button
            data-testid="chat-send-button"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded-full bg-primary hover:bg-primary/90"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}