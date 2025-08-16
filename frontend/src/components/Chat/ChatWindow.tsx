import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "../../utils/queryResultRow";
import Header from "../Common/Header";
import InputArea from "../Common/InputArea";
import MessageBubble from "./MessageBubble";
import EmptyState from "./EmptyState";
import LoadingIndicator from "./LoadingIndicator";
import { chatService, ApiErrorDetail } from "@/services/chatService";

const ChatWindow = () => {
  const userId = "1";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<{
    [key: number]: boolean;
  }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleDetails = (index: number) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Load chat history
  useEffect(() => {
    async function fetchChats() {
      try {
        const chats = await chatService.getUserChats(userId);
        
        const formattedMessages: ChatMessage[] = chats.flatMap((chat) => [
          {
            role: "user",
            content: chat.message,
            timestamp: chat.created_at,
          },
          {
            role: "bot",
            content: chat.explanation,
            timestamp: chat.created_at,
            sqlQuery: chat.sql_query,
            queryResults: chat.query_results,
            provider: chat.provider,
          },
        ]);

        setMessages(formattedMessages);
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    }

    fetchChats();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setIsTyping(true);

    try {
      const response = await chatService.sendMessage(input);

      const botMessage: ChatMessage = {
        role: "bot",
        content: response.explanation,
        timestamp: new Date().toISOString(),
        sqlQuery: response.sql_query,
        queryResults: JSON.stringify(response.results),
        provider: response.provider,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorDetail = error as ApiErrorDetail;
      
      const errorMessageObj: ChatMessage = {
        role: "error",
        content: JSON.stringify(errorDetail),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="mt-4 flex flex-col h-[95vh] w-full max-w-6xl mx-auto bg-gradient-to-br from-gray-50 to-blue-50 text-gray-800 rounded-2xl shadow-xl overflow-hidden font-montserrat">
      {/* Header */}
      <Header isTyping={isTyping} />

      {/* Chat messages container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.length === 0 && !loading ? (
          <EmptyState setInput={setInput} />
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              } animate-slide-in`}
            >
              <div
                className={`flex items-start max-w-[90%] ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                      : msg.role === "error"
                      ? "bg-red-100 text-red-600 border border-red-200"
                      : "bg-white text-gray-700 border border-gray-300"
                  }`}
                >
                  {msg.role === "user" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : msg.role === "error" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <MessageBubble
                  message={msg}
                  expandedDetails={!!expandedDetails[index]}
                  toggleDetails={() => toggleDetails(index)}
                />
              </div>
            </div>
          ))
        )}

        {loading && <LoadingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <InputArea
        input={input}
        loading={loading}
        onInputChange={setInput}
        onSend={handleSend}
        onAttach={() => console.log('Attach clicked')}
        onEmoji={() => console.log('Emoji clicked')}
      />
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap");

        body {
          font-family: "Montserrat", sans-serif;
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-in forwards;
        }

        .animate-bounce {
          animation: bounce 1s infinite;
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .font-montserrat {
          font-family: "Montserrat", sans-serif;
        }
      `}</style>
    </div>
  );
};

export default ChatWindow;