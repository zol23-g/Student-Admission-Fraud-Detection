import React, { useState } from "react";
import { ChatMessage } from "../../utils/queryResultRow";
import CodeBlock from "./CodeBlock";
import QueryResultsTable from "./QueryResultsTable";
import VisualizationSection from "./VisualizationSection";
import { copyToClipboard, safeJsonParse } from "../../utils/chatUtils";

interface MessageBubbleProps {
  message: ChatMessage;
  expandedDetails: boolean;
  toggleDetails: () => void;
  onEditMessage?: (newMessage: string) => void;
  isEditing?: boolean;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
}

const ErrorMessage: React.FC = () => {
  return (
    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <svg 
            className="h-5 w-5 text-red-400" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">We couldn&apos;t process your request</h3>
          <div className="mt-2 text-sm text-red-700">
            <div className="p-3 bg-red-100 rounded-lg">
              <p className="font-semibold">Please try:</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Rephrasing your question</li>
                <li>Using simpler terms</li>
                <li>Asking about something else</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const CopyIcon = () => (
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
);

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  expandedDetails,
  toggleDetails,
  onEditMessage,
  isEditing,
  onSaveEdit,
  onCancelEdit,
}) => {
  const [editedContent, setEditedContent] = useState(message.content);
  const queryResults = safeJsonParse(message.queryResults);

  const handleSave = () => {
    if (onEditMessage) {
      onEditMessage(editedContent);
    }
    if (onSaveEdit) {
      onSaveEdit();
    }
  };

  const handleCopy = () => {
    copyToClipboard(editedContent);
  };

  const formatTextContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
    return parts.map((part, index) => {
      if ((part.startsWith("**") && part.endsWith("**")) || 
          (part.startsWith("__") && part.endsWith("__"))) {
        return (
          <strong key={index} className="font-bold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      } else {
        const formattedText = text.split("\n").map((line, lineIndex) => {
          if (line.match(/^\d+\./)) {
            return (
              <div key={lineIndex} className="flex mb-2 pl-4">
                <span className="text-[#005D5B] font-bold mr-3 min-w-[24px]">
                  {line.match(/^\d+/)?.[0]}.
                </span>
                <span className="text-gray-800">
                  {line.replace(/^\d+\.\s*/, "")}
                </span>
              </div>
            );
          } else if (line.match(/^-\s/)) {
            return (
              <div key={lineIndex} className="flex mb-2 pl-4">
                <span className="text-[#005D5B] font-bold mr-3">•</span>
                <span className="text-gray-800">
                  {line.replace(/^-\s*/, "")}
                </span>
              </div>
            );
          } else if (line.match(/^>\s/)) {
            return (
              <div
                key={lineIndex}
                className="border-l-4 border-blue-400 pl-4 my-3 text-gray-700 italic bg-blue-50 py-2 rounded-r-lg"
              >
                {line.replace(/^>\s*/, "")}
              </div>
            );
          } else if (line.match(/^#+\s/)) {
            const level = line.match(/^#+/)?.[0].length || 1;
            const headingClass = [
              "font-bold my-4",
              level === 1 ? "text-2xl" : "",
              level === 2 ? "text-xl" : "",
              level === 3 ? "text-lg" : "",
              level >= 4 ? "text-base" : "",
            ].join(" ");
            return (
              <div key={lineIndex} className={`${headingClass} text-gray-900`}>
                {line.replace(/^#+\s*/, "")}
              </div>
            );
          } else if (line.trim() === "") {
            return <br key={lineIndex} />;
          } else {
            return (
              <p
                key={lineIndex}
                className="mb-3 last:mb-0 leading-relaxed text-gray-800"
              >
                {line}
              </p>
            );
          }
        });
        return <div key={index}>{formattedText}</div>;
      }
    });
  };

  const formatMessageContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        return <CodeBlock key={index} code={part.slice(3, -3).trim()} />;
      } else if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={index}
            className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-[15px] font-mono border border-gray-300"
          >
            {part.slice(1, -1)}
          </code>
        );
      } else {
        return formatTextContent(part);
      }
    });
  };

  if (message.role === "user" && isEditing) {
    return (
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 shadow-md mx-3" style={{ maxWidth: "90%" }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-[#005D5B]">Editing your question</span>
        </div>
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-[#005D5B] focus:border-[#005D5B]"
          rows={3}
          autoFocus
          style={{ minWidth: "600px" }}
        />
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={handleCopy}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800"
            title="Copy to clipboard"
          >
            <CopyIcon />
            <span className="ml-1">Copy</span>
          </button>
          <div className="flex space-x-2">
            <button
              onClick={onCancelEdit}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm text-white bg-[#005D5B] hover:bg-[#008080] rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-2xl transition-all duration-200 mx-3 ${
        message.role === "user"
          ? "bg-gradient-to-r from-[#005D5B] to-[#008080] text-white shadow-lg"
          : message.role === "error"
          ? "bg-red-50 text-red-800 border border-red-200 shadow-md"
          : "bg-white text-gray-800 border border-gray-300 shadow-md"
      }`}
      style={{
        maxWidth: "calc(100% - 60px)",
        minWidth: "200px",
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <span
            className={`text-sm font-bold ${
              message.role === "user"
                ? "text-blue-100"
                : message.role === "error"
                ? "text-red-700"
                : "text-gray-700"
            }`}
          >
            {message.role === "user"
              ? "You"
              : message.role === "error"
              ? "Warning !"
              : "AI Assistant"}
          </span>
          {message.role === "bot" && message.provider && (
            <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {message.provider === "cohere" ? "Cohere" : "Gemini"}
            </span>
          )}
        </div>
        <span
          className={`text-xs ${
            message.role === "user"
              ? "text-blue-200"
              : message.role === "error"
              ? "text-red-600"
              : "text-gray-500"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div
        className={`text-[18px] leading-relaxed ${
          message.role === "user"
            ? "text-white"
            : message.role === "error"
            ? "text-red-800"
            : "text-gray-800"
        }`}
      >
        {message.role === "error" ? (
          <ErrorMessage />
        ) : message.role === "bot" ? (
          <>
            {formatMessageContent(message.content)}

            {(message.sqlQuery || queryResults) && (
              <div className="mt-4">
                <button
                  onClick={toggleDetails}
                  className="flex items-center text-sm text-[#005D5B] hover:text-[#008080] font-medium"
                >
                  {expandedDetails
                    ? "Hide details"
                    : "Show technical details"}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 ml-1 transition-transform ${
                      expandedDetails ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {expandedDetails && (
                  <div className="mt-3 space-y-4">
                    {queryResults &&
                      Array.isArray(queryResults) && (
                        <>
                          {message.sqlQuery && (
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <h4 className="text-sm font-medium text-gray-700">
                                  SQL Query:
                                </h4>
                                <button
                                  onClick={() => copyToClipboard(message.sqlQuery || "")}
                                  className="text-gray-500 hover:text-[#005D5B] p-1 rounded hover:bg-gray-100 transition-colors"
                                  title="Copy to clipboard"
                                >
                                  <CopyIcon />
                                </button>
                              </div>
                              <div className="bg-gray-900 p-3 rounded-lg overflow-x-auto border border-gray-700">
                                <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
                                  {message.sqlQuery}
                                </pre>
                              </div>
                            </div>
                          )}

                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">
                              Query Results:
                            </h4>
                            <QueryResultsTable results={queryResults} />
                          </div>

                          <VisualizationSection 
                            results={queryResults} 
                            content={message.content} 
                          />
                        </>
                      )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{message.content}</p>
            <div className="flex justify-end mt-2">
              {onEditMessage && (
                <button
                  onClick={() => {
                    setEditedContent(message.content);
                    onEditMessage(message.content);
                  }}
                  className="text-gray-400 hover:text-[#005D5B] p-1 rounded hover:bg-gray-100 transition-colors"
                  title="Edit message"
                >
                  <EditIcon />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;