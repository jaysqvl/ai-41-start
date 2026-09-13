"use client";
import { useState, useEffect } from "react";
import {
  generateUniqueID,
  getChatID,
  setCookiesChatId,
  clearChatIDCookie,
} from "../utils/chatHelpers";

const useChatSession = () => {
  const [chatId, setChatId] = useState(() => getChatID() || generateUniqueID());

  useEffect(() => {
    // Synchronize the initialized session with the browser cookie after mount.
    if (!getChatID()) {
      setCookiesChatId(chatId);
    }
  }, [chatId]);

  const clearChatSession = () => {
    clearChatIDCookie(); // Clear the chat ID from cookies
    setChatId(generateUniqueID()); // Start a fresh session.
  };

  // Function to refresh or create a new chat session if needed
  const refreshChatSession = () => {
    const newChatId = generateUniqueID();
    setCookiesChatId(newChatId);
    setChatId(newChatId);
  };

  return { chatId, clearChatSession, refreshChatSession };
};

export default useChatSession;
