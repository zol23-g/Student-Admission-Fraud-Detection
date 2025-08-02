import React from "react";

const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="flex items-start">
        <div className="w-9 h-9 rounded-full bg-white text-gray-700 border border-gray-300 flex items-center justify-center text-sm font-bold shadow-sm">
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
        </div>
        <div className="p-4 rounded-2xl bg-white text-gray-800 shadow-md border border-gray-300 ml-3 max-w-xs">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"></div>
              <div
                className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Thinking ...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;