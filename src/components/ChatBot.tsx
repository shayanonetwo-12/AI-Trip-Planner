import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Sparkles, Compass, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { chatApi } from "../lib/geminiClient";

interface ChatBotProps {
  activeItinerary: any;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatBot({ activeItinerary }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message when active itinerary changes or on first mount
  useEffect(() => {
    const welcomeText = activeItinerary
      ? `Hello! I see you are planning a trip to **${activeItinerary.destination}**. 🌍\n\nI am your AI travel companion. Ask me anything about this trip! For example, I can help you with:\n- 🎒 **Packing suggestions**\n- 🍜 **Local delicacies** you must try\n- 💡 **Etiquette, customs, and tipping** norms\n- 🔄 **Customizing** your active days`
      : "Hello! 🌍 I am your AI travel companion. Tell me where you are heading, or ask me any questions about planning your dream journey!";

    setMessages([
      {
        role: "assistant",
        content: welcomeText,
        timestamp: new Date(),
      },
    ]);
  }, [activeItinerary?.destination]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    if (!textToSend) {
      setInputValue("");
    }

    const newUserMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const assistantResponseContent = await chatApi(
        updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        activeItinerary
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantResponseContent,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble connecting to my servers. Please try again in a moment! 🔌",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic Markdown text formatter helper (handles bold, bullets, and linebreaks)
  const formatMessageText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      // Check for bullet lists
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const content = line.trim().substring(2);
        return (
          <li key={`line-${lineIdx}`} className="ml-4 list-disc text-xs sm:text-sm my-0.5 leading-relaxed">
            {renderBoldText(content)}
          </li>
        );
      }
      
      // Check for numbered lists
      const numberedMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numberedMatch) {
        const content = numberedMatch[2];
        return (
          <li key={`line-${lineIdx}`} className="ml-4 list-decimal text-xs sm:text-sm my-0.5 leading-relaxed">
            {renderBoldText(content)}
          </li>
        );
      }

      // Check for empty line
      if (line.trim() === "") {
        return <div key={`empty-${lineIdx}`} className="h-2" />;
      }

      // Regular line
      return (
        <p key={`line-${lineIdx}`} className="text-xs sm:text-sm leading-relaxed my-0.5">
          {renderBoldText(line)}
        </p>
      );
    });
  };

  // Render text replacing **text** with <strong>text</strong>
  const renderBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={`bold-${i}-${part.slice(0, 10)}`} className="font-bold text-[#33332D]">{part}</strong>;
      }
      return part;
    });
  };

  const dynamicChips = activeItinerary
    ? [
        { label: "🎒 Packing suggestions", query: `Provide a quick recommended packing list for my trip to ${activeItinerary.destination}` },
        { label: "🍜 Local foods to try", query: `What are some of the most famous local foods and restaurants to try in ${activeItinerary.destination}?` },
        { label: "💡 Cultural customs", query: `Are there any unique local customs, tipping habits, or etiquette I should know about in ${activeItinerary.destination}?` },
        { label: "🌦️ Best time to visit", query: `What is the typical weather and best time of year to explore ${activeItinerary.destination}?` },
      ]
    : [
        { label: "🧭 Give me a random idea", query: "Can you recommend a surprise travel destination with unique local charm?" },
        { label: "🧳 Packing essentials", query: "What are the universal packing essentials every smart traveler needs?" },
      ];

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-6 right-6 z-[1999]">
        <motion.button
          id="chatbot-trigger-btn"
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group bg-[#5A5A40] hover:bg-[#484833] text-white p-4 rounded-full shadow-2xl flex items-center justify-center cursor-pointer border border-[#CCD5AE]/40"
        >
          <MessageSquare className="w-6 h-6" />
          
          {/* Notification bubble if not open */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 bg-[#D4A373] w-3.5 h-3.5 rounded-full border-2 border-[#F5F2ED] animate-pulse" />
          )}

          {/* Quick Tooltip label */}
          <span className="absolute right-14 bg-white text-[#33332D] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#DCD7CC] shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap">
            Ask Travel Companion ✈️
          </span>
        </motion.button>
      </div>

      {/* Expandable Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chatbot-window"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 z-[2000] sm:w-[400px] h-[500px] max-h-[calc(100vh-115px)] bg-[#F5F2ED] rounded-3xl shadow-2xl border border-[#DCD7CC] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#5A5A40] text-white px-5 py-4 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-[#FAEED1]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base tracking-tight leading-none text-[#FAEED1]">
                    WanderAI Companion
                  </h3>
                  <span className="text-[10px] text-[#E9EDC9] font-semibold tracking-wider uppercase block mt-1">
                    {activeItinerary ? `Tuned to ${activeItinerary.destination.split(",")[0]}` : "Online Assistant"}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-[#E9EDC9] hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context bar if an itinerary is active */}
            {activeItinerary && (
              <div className="bg-[#E9EDC9]/40 border-b border-[#CCD5AE]/30 px-4 py-2 flex items-center gap-2 shrink-0">
                <Compass className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-wide truncate">
                  Referencing current {activeItinerary.days.length}-day trip
                </span>
              </div>
            )}

            {/* Message Logs Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
              {messages.map((message, idx) => {
                const isUser = message.role === "user";
                const msgKey = message.id || `msg-${idx}-${message.timestamp ? message.timestamp.getTime() : idx}`;
                return (
                  <div
                    key={msgKey}
                    className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2.5 max-w-[85%] ${
                      isUser ? "self-end" : "self-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-[#5A5A40] text-white flex items-center justify-center text-xs font-serif font-bold shrink-0 mt-0.5 shadow-sm">
                        W
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl shadow-sm border ${
                        isUser
                          ? "bg-[#D4A373] text-white border-[#D4A373]/20 rounded-tr-none"
                          : "bg-white text-[#33332D] border-[#DCD7CC] rounded-tl-none"
                      }`}
                    >
                      <div className="space-y-1">
                        {formatMessageText(message.content)}
                      </div>
                      <span
                        className={`text-[9px] block text-right mt-1.5 ${
                          isUser ? "text-white/70" : "text-[#7D7667]"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start items-center gap-2.5 max-w-[80%] self-start">
                  <div className="w-7 h-7 rounded-lg bg-[#5A5A40] text-white flex items-center justify-center text-xs font-serif font-bold shrink-0 shadow-sm animate-pulse">
                    W
                  </div>
                  <div className="bg-white border border-[#DCD7CC] p-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                    <span className="w-2.5 h-2.5 bg-[#D4A373] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2.5 h-2.5 bg-[#D4A373] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2.5 h-2.5 bg-[#D4A373] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 bg-[#F9F8F6] border-t border-[#DCD7CC] flex gap-2 overflow-x-auto shrink-0 scrollbar-none py-2.5">
              {dynamicChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.query)}
                  disabled={isLoading}
                  className="whitespace-nowrap bg-white hover:bg-[#F5F2ED] text-[#7D7667] hover:text-[#5A5A40] border border-[#DCD7CC] px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all shrink-0 disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Footer Form Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-[#DCD7CC] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={activeItinerary ? "Ask about packing, food, customs..." : "Ask me anything..."}
                disabled={isLoading}
                className="flex-1 bg-[#F5F2ED] border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A373]/30 focus:border-[#D4A373] transition-all text-[#33332D] placeholder-[#7D7667]/50 font-medium"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-[#D4A373] hover:bg-[#C29262] text-white p-2.5 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
