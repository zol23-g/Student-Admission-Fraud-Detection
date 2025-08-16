// services/chatService.ts
import axios from "axios";
import { QueryResultRow } from "@/utils/queryResultRow";

const API_BASE_URL = "http://localhost:8000/api/v1/chat";

export interface ApiErrorDetail {
  error: string;
  message: string;
  resolution?: string;
  generated_query?: string;
}

interface ChatItem {
  message: string;
  explanation: string;
  sql_query: string;
  query_results: QueryResultRow[] | string;
  provider: string;
  created_at: string;
}

interface ChatResponse {
  explanation: string;
  sql_query: string;
  results: QueryResultRow[];
  provider: string;
  result_count?: number;
}

interface BackendErrorResponse {
  detail: ApiErrorDetail;
}

export const chatService = {
  async getUserChats(userId: string): Promise<ChatItem[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-chats/${userId}`);
      return response.data.chats;
    } catch (error) {
      const parsedError = this.parseError(error);
      console.error("Failed to fetch user chats:", parsedError);
      throw parsedError;
    }
  },

  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      const response = await axios.post<ChatResponse>(
        `${API_BASE_URL}/query-with-chain`,
        { message, conversation_id: null }
      );
      return response.data;
    } catch (error) {
      const parsedError = this.parseError(error);
      console.error("Failed to send message:", parsedError);
      throw parsedError;
    }
  },

  parseError(error: unknown): ApiErrorDetail {
    // Handle Axios error with backend response
    if (axios.isAxiosError<BackendErrorResponse>(error)) {
      if (error.response?.data?.detail) {
        return error.response.data.detail;
      }
      return {
        error: "Network Error",
        message: error.message,
        resolution: "Please check your connection and try again"
      };
    }

    // Handle Error objects
    if (error instanceof Error) {
      try {
        return JSON.parse(error.message) as ApiErrorDetail;
      } catch {
        return {
          error: "Error",
          message: error.message,
          resolution: "Please try again later"
        };
      }
    }

    // Fallback for unknown errors
    return {
      error: "Unknown Error",
      message: "An unexpected error occurred",
      resolution: "Please try again later"
    };
  }
};