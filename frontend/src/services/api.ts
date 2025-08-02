// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE = 'http://localhost:8000/user-chats';

export const sendChatMessage = async (userId: string, message: string) => {
  const res = await axios.post(API_BASE, {
    user_id: userId,
    message
  });
  return res.data;
};

export const getChatMessages = async (userId: string) => {
  const res = await axios.get(`${API_BASE}/${userId}`);
  return res.data; // array of { role, content }
};
