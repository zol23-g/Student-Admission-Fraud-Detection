import React from 'react';

const Header = ({ isTyping = false }) => {
  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-gray-200/70 p-5 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white"></div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Safe</h2>
          <p className="text-sm text-gray-600">
            {isTyping ? (
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>
                <span
                  className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></span>
                <span
                  className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></span>
              </span>
            ) : (
              "Ready to analyze your data"
            )}
          </p>
        </div>
      </div>
      <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

export default Header;