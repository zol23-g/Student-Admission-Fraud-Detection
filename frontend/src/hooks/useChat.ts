// frontend/src/hooks/useChat.ts
import { useEffect, useState } from 'react';
import { sendChatMessage, getChatMessages } from '../services/api';

type Message = { role: 'user' | 'assistant'; content: string };

export function useChat(userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const history = await getChatMessages(userId);
        setMessages(history);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [userId]);

  const sendMessage = async (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    const res = await sendChatMessage(userId, message);
    setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
  };

  return { messages, sendMessage, loading };
}
