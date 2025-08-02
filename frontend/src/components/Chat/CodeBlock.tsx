import React from "react";
import { copyToClipboard } from "../../utils/chatUtils";

interface CodeBlockProps {
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  const isSQL =
    code.toLowerCase().includes("select") ||
    code.toLowerCase().includes("from") ||
    code.toLowerCase().includes("where");

  return (
    <div className="my-3 bg-gray-900 p-0 rounded-xl border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center">
          <div className="flex space-x-2 mr-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm text-gray-400 font-mono">
            {isSQL ? "SQL" : "CODE"}
          </span>
        </div>
        <button
          onClick={() => copyToClipboard(code)}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
          title="Copy to clipboard"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
        </button>
      </div>
      <pre className="text-[15px] leading-relaxed text-gray-100 font-mono whitespace-pre-wrap p-4 overflow-x-auto">
        {code}
      </pre>
    </div>
  );
};

export default CodeBlock;