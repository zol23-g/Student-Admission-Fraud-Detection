// services/chatService.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1/chat";

interface ChatItem {
  message: string;
  explanation: string;
  sql_query: string;
  query_results: any;
  provider: string;
  created_at: string;
}

interface ChatResponse {
  explanation: string;
  sql_query: string;
  results: any;
  provider: string;
}

export const chatService = {
  async getUserChats(userId: string): Promise<ChatItem[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-chats/${userId}`);
      return response.data.chats;
    } catch (error) {
      console.error("Failed to fetch user chats:", error);
      throw error;
    }
  },

  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/query-with-chain`,
        {
          message,
          conversation_id: null,
        },
        {
          validateStatus: (status) => status < 500,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  },

  handleError(error: unknown): string {
    let errorMessage = "An error occurred while processing your request.";

    if (axios.isAxiosError(error)) {
      if (error.response) {
        if (
          error.response.status === 400 &&
          typeof error.response.data?.detail === "string" &&
          error.response.data.detail.includes("too many tokens")
        ) {
          errorMessage =
            "The conversation has become too long for the AI to process. Please start a new conversation or ask a more specific question.";
        } else if (error.response.status === 400 && error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.status === 500) {
          errorMessage =
            "Our servers are experiencing issues. Please try again later.";
        }
      }
    }

    return errorMessage;
  },
};