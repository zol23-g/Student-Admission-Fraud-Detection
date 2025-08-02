import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  BarChartVisualization,
  PieChartVisualization,
  TableVisualization,
} from "../visualizations/ChartVisualizations";
import {
  type VisualizationConfig,
  type QueryResultRow,
  type ChatItem,
  type ChatMessage,
  determineVisualizationType,
  generateVisualizationConfig,
} from "../../utils/queryResultRow";
import Header from "../Common/Header";
import InputArea from "../Common/InputArea";

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

  // Utility functions
  const toggleDetails = (index: number) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show temporary tooltip
      const tooltip = document.createElement("div");
      tooltip.className = "fixed bg-gray-800 text-white text-sm px-2 py-1 rounded-md shadow-lg";
      tooltip.textContent = "Copied!";
      tooltip.style.top = `${window.scrollY + 50}px`;
      tooltip.style.left = `${window.innerWidth / 2 - 30}px`;
      document.body.appendChild(tooltip);
      
      setTimeout(() => {
        document.body.removeChild(tooltip);
      }, 1500);
    });
  };

  // Data formatting functions
  const safeJsonParse = (
    str: string | QueryResultRow[] | undefined | null
  ): QueryResultRow[] | string | null => {
    if (!str || typeof str !== "string") return str || null;

    try {
      const cleanedStr = str
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t");

      return JSON.parse(cleanedStr) as QueryResultRow[];
    } catch (e) {
      console.error("Failed to parse JSON:", str, e);
      return null;
    }
  };

  const formatQueryResults = (results: QueryResultRow[] | string | null) => {
    if (!results) return null;

    const parsedResults =
      typeof results === "string" ? safeJsonParse(results) : results;
    if (
      !parsedResults ||
      (Array.isArray(parsedResults) && parsedResults.length === 0)
    )
      return null;

    if (!Array.isArray(parsedResults)) return null;

    const columns = Object.keys(parsedResults[0]);

    return (
      <div className="mt-4 overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow-sm border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedResults.map((row: QueryResultRow, rowIndex: number) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {columns.map((col) => (
                      <td
                        key={`${rowIndex}-${col}`}
                        className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 max-w-xs overflow-hidden text-ellipsis"
                      >
                        {typeof row[col] === "object"
                          ? JSON.stringify(row[col])
                          : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-gray-500 px-4 py-2 text-right bg-gray-50">
              Showing {parsedResults.length} row
              {parsedResults.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const formatMessageContent = (content: string) => {
    const parts = content.split(
      /(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__)/g
    );
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const code = part.slice(3, -3).trim();
        const isSQL =
          code.toLowerCase().includes("select") ||
          code.toLowerCase().includes("from") ||
          code.toLowerCase().includes("where");

        return (
          <div
            key={index}
            className="my-3 bg-gray-900 p-0 rounded-xl border border-gray-700 overflow-hidden"
          >
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
      } else if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={index}
            className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-[15px] font-mono border border-gray-300"
          >
            {part.slice(1, -1)}
          </code>
        );
      } else if (
        (part.startsWith("**") && part.endsWith("**")) ||
        (part.startsWith("__") && part.endsWith("__"))
      ) {
        return (
          <strong key={index} className="font-bold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      } else {
        const formattedText = part.split("\n").map((line, lineIndex) => {
          if (line.match(/^\d+\./)) {
            return (
              <div key={lineIndex} className="flex mb-2 pl-4">
                <span className="text-blue-600 font-bold mr-3 min-w-[24px]">
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
                <span className="text-blue-600 font-bold mr-3">•</span>
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

  // Data handling functions
  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await axios.get(
          `http://127.0.0.1:8000/api/v1/chat/user-chats/${userId}`
        );
        const data: ChatItem[] = res.data.chats;

        const formattedMessages: ChatMessage[] = data.flatMap((chat) => [
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
      const res = await axios.post(
        "http://localhost:8000/api/v1/chat/query-with-chain",
        {
          message: input,
          conversation_id: null,
        },
        {
          validateStatus: (status) => status < 500,
        }
      );

      const botMessage: ChatMessage = {
        role: "bot",
        content: res.data.explanation,
        timestamp: new Date().toISOString(),
        sqlQuery: res.data.sql_query,
        queryResults: res.data.results,
        provider: res.data.provider,
      };

      setTimeout(() => {
        setMessages((prev) => [...prev, botMessage]);
        setLoading(false);
        setIsTyping(false);
      }, 800);
    } catch (err: unknown) {
      console.error("Failed to get response:", err);

      let errorMessage = "An error occurred while processing your request.";

      if (axios.isAxiosError(err)) {
        if (err.response) {
          if (
            err.response.status === 400 &&
            typeof err.response.data?.detail === "string" &&
            err.response.data.detail.includes("too many tokens")
          ) {
            errorMessage =
              "The conversation has become too long for the AI to process. Please start a new conversation or ask a more specific question.";
          } else if (err.response.status === 400 && err.response.data?.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.status === 500) {
            errorMessage =
              "Our servers are experiencing issues. Please try again later.";
          }
        }
      }

      const errorMessageObj: ChatMessage = {
        role: "error",
        content: errorMessage,
        timestamp: new Date().toISOString(),
      };

      setTimeout(() => {
        setMessages((prev) => [...prev, errorMessageObj]);
        setLoading(false);
        setIsTyping(false);
      }, 800);
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
                onClick={() =>
                  setInput("Show me sales trends for the last quarter")
                }
                className="px-5 py-3 bg-white rounded-xl border border-gray-200 shadow-sm text-base text-gray-700 hover:bg-gray-50 transition-colors text-left hover:border-blue-300 hover:shadow-md"
              >
                "Show me sales trends for the last quarter"
              </button>
              <button
                onClick={() =>
                  setInput("Compare revenue by product category")
                }
                className="px-5 py-3 bg-white rounded-xl border border-gray-200 shadow-sm text-base text-gray-700 hover:bg-gray-50 transition-colors text-left hover:border-blue-300 hover:shadow-md"
              >
                "Compare revenue by product category"
              </button>
              <button
                onClick={() =>
                  setInput("Create a pie chart of customer demographics")
                }
                className="px-5 py-3 bg-white rounded-xl border border-gray-200 shadow-sm text-base text-gray-700 hover:bg-gray-50 transition-colors text-left hover:border-blue-300 hover:shadow-md"
              >
                "Create a pie chart of customer demographics"
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const queryResults = safeJsonParse(msg.queryResults);

            return (
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
                  <div
                    className={`p-4 rounded-2xl transition-all duration-200 mx-3 ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                        : msg.role === "error"
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
                            msg.role === "user"
                              ? "text-blue-100"
                              : msg.role === "error"
                              ? "text-red-700"
                              : "text-gray-700"
                          }`}
                        >
                          {msg.role === "user"
                            ? "You"
                            : msg.role === "error"
                            ? "Error"
                            : "AI Assistant"}
                        </span>
                        {msg.role === "bot" && msg.provider && (
                          <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {msg.provider === "cohere" ? "Cohere" : "Gemini"}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs ${
                          msg.role === "user"
                            ? "text-blue-200"
                            : msg.role === "error"
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div
                      className={`text-[18px] leading-relaxed ${
                        msg.role === "user"
                          ? "text-white"
                          : msg.role === "error"
                          ? "text-red-800"
                          : "text-gray-800"
                      }`}
                    >
                      {msg.role === "bot" ? (
                        <>
                          {formatMessageContent(msg.content)}

                          {(msg.sqlQuery || queryResults) && (
                            <div className="mt-4">
                              <button
                                onClick={() => toggleDetails(index)}
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {expandedDetails[index]
                                  ? "Hide details"
                                  : "Show technical details"}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`h-4 w-4 ml-1 transition-transform ${
                                    expandedDetails[index] ? "rotate-180" : ""
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

                              {expandedDetails[index] && (
                                <div className="mt-3 space-y-4">
                                  {queryResults &&
                                    Array.isArray(queryResults) &&
                                    queryResults.length > 0 && (
                                      <>


                                        {/* SQL and results display */}
                                        {msg.sqlQuery && (
                                          <div>
                                            <div className="flex justify-between items-center mb-1">
                                              <h4 className="text-sm font-medium text-gray-700">
                                                SQL Query:
                                              </h4>
                                              <button
                                                onClick={() =>
                                                  copyToClipboard(
                                                    msg.sqlQuery || ""
                                                  )
                                                }
                                                className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-gray-100 transition-colors"
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
                                            <div className="bg-gray-900 p-3 rounded-lg overflow-x-auto border border-gray-700">
                                              <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
                                                {msg.sqlQuery}
                                              </pre>
                                            </div>
                                          </div>
                                        )}

                                        <div>
                                          <h4 className="text-sm font-medium text-gray-700 mb-1">
                                            Query Results:
                                          </h4>
                                          {formatQueryResults(queryResults)}
                                        </div>

                                        {/* Visualization section */}
                                        <div className="mb-6">
                                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                                            Data Visualization:
                                          </h4>
                                          {determineVisualizationType(
                                            queryResults
                                          ) === "bar" ? (
                                            <BarChartVisualization
                                              config={generateVisualizationConfig(
                                                queryResults,
                                                msg.content
                                              )}
                                            />
                                          ) : determineVisualizationType(
                                              queryResults
                                            ) === "pie" ? (
                                            <PieChartVisualization
                                              config={generateVisualizationConfig(
                                                queryResults,
                                                msg.content
                                              )}
                                            />
                                          ) :
                                          
                                          (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                              <p className="text-gray-600">
                                                Table view is most appropriate
                                                for this data
                                              </p>
                                            </div>
                                          )

                                          // (
                                          //   <TableVisualization
                                          //     config={generateVisualizationConfig(
                                          //       queryResults,
                                          //       msg.content
                                          //     )}
                                          //   />
                                          // )
                                        
                                          }
                                        </div>

                                      </>
                                    )}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {loading && (
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
        )}

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