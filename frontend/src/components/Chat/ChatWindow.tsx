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
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle scroll events
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      setShowScrollButton(!isNearBottom);
    };

    // Initial check
    handleScroll();

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages]);

  const toggleDetails = (index: number) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleEditMessage = async (newMessage: string) => {
    if (editingMessageId === null) return;
    
    try {
      // Update the message in local state first for instant feedback
      setMessages(prev => prev.map((msg, idx) => 
        idx === editingMessageId ? { ...msg, content: newMessage } : msg
      ));
      
      // Send the edited message to the backend
      setLoading(true);
      setIsTyping(true);

      const response = await chatService.sendMessage(newMessage);

      const botMessage: ChatMessage = {
        role: "bot",
        content: response.explanation,
        timestamp: new Date().toISOString(),
        sqlQuery: response.sql_query,
        queryResults: JSON.stringify(response.results),
        provider: response.provider,
      };

      // Replace the old conversation with the new one
      setMessages(prev => [
        ...prev.slice(0, editingMessageId + 1),
        botMessage
      ]);
      
    } catch (error) {
      const errorDetail = error as ApiErrorDetail;
      const errorMessageObj: ChatMessage = {
        role: "error",
        content: JSON.stringify(errorDetail),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setLoading(false);
      setIsTyping(false);
      setEditingMessageId(null);
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  return (
    <div className="mt-4 flex flex-col h-[95vh] w-full max-w-6xl mx-auto bg-gradient-to-br from-gray-50 to-blue-50 text-gray-800 rounded-2xl shadow-xl overflow-hidden font-montserrat relative">
      {/* Header */}
      <Header isTyping={isTyping} />

      {/* Chat messages container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-5 relative"
      >
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
                      ? "bg-gradient-to-br from-[#005D5B] to-[#008080] text-white"
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
                  onEditMessage={(newMessage) => {
                    setEditingMessageId(index);
                    handleEditMessage(newMessage);
                  }}
                  isEditing={editingMessageId === index}
                  onSaveEdit={() => setEditingMessageId(null)}
                  onCancelEdit={() => setEditingMessageId(null)}
                />
              </div>
            </div>
          ))
        )}

        {loading && <LoadingIndicator />}

        <div ref={messagesEndRef} />

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <div className="fixed bottom-44 left-1/2 transform -translate-x-1/2 z-50">
            <button
              onClick={scrollToBottom}
              className="bg-[#005D5B] hover:bg-[#008080] text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 flex items-center justify-center"
              aria-label="Scroll to bottom"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>
          </div>
        )}
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