import React, { useRef, KeyboardEvent, useEffect } from 'react';

interface InputAreaProps {
  input?: string;
  loading?: boolean;
  onInputChange?: (value: string) => void;
  onSend?: () => void;
  onAttach?: () => void;
  onEmoji?: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ 
  input = '', 
  loading = false, 
  onInputChange = () => {}, 
  onSend = () => {}, 
  onAttach = () => {}, 
  onEmoji = () => {} 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Auto-focus on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className="bg-white/90 backdrop-blur-md border-t border-gray-200/70 p-5">
      <div className="flex gap-3 items-center">
        <button 
          onClick={onAttach}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
          aria-label="Attach file"
          disabled={loading}
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
              strokeWidth={1.8}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ask about your data..."
            onKeyDown={handleKeyDown}
            rows={1}
            className="w-full p-4 pr-14 rounded-xl bg-white text-gray-800 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 hover:border-gray-400 shadow-sm resize-none max-h-80 text-[15px]"
            style={{ minHeight: "56px" }}
            disabled={loading}
          />
          <button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className={`absolute right-3 bottom-3 p-2 rounded-full transition-all duration-300 ${
              loading || !input.trim()
                ? "text-gray-300 cursor-not-allowed"
                : "text-white bg-blue-500 hover:bg-blue-600 shadow-lg"
            }`}
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <button 
          onClick={onEmoji}
          className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
          aria-label="Add emoji"
          disabled={loading}
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
              strokeWidth={1.8}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        AI can make mistakes. Verify important data insights.
      </p>
    </div>
  );
};

export default InputArea;