import React from "react";

interface EmptyStateProps {
  setInput: (input: string) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ setInput }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in">
      <div className="w-32 h-32 mb-7 bg-gradient-to-br from-white to-blue-50 rounded-full flex items-center justify-center border-2 border-blue-100 shadow-inner">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        How can I help with your data today?
      </h3>
      <p className="text-base text-gray-600 max-w-md leading-relaxed mb-5">
        Ask me to analyze data, create visualizations, or try these examples:
      </p>
      <div className="grid grid-cols-1 gap-3 w-full max-w-md">
        <button
          onClick={() => setInput("Show me sales trends for the last quarter")}
          className="px-5 py-3 bg-white rounded-xl border border-gray-200 shadow-sm text-base text-gray-700 hover:bg-gray-50 transition-colors text-left hover:border-blue-300 hover:shadow-md"
        >
          "Show me sales trends for the last quarter"
        </button>
        <button
          onClick={() => setInput("Compare revenue by product category")}
          className="px-5 py-3 bg-white rounded-xl border border-gray-200 shadow-sm text-base text-gray-700 hover:bg-gray-50 transition-colors text-left hover:border-blue-300 hover:shadow-md"
        >
          "Compare revenue by product category"
        </button>
        <button
          onClick={() => setInput("Create a pie chart of customer demographics")}
          className="px-5 py-3 bg-white rounded-xl border border-gray-200 shadow-sm text-base text-gray-700 hover:bg-gray-50 transition-colors text-left hover:border-blue-300 hover:shadow-md"
        >
          "Create a pie chart of customer demographics"
        </button>
      </div>
    </div>
  );
};

export default EmptyState;