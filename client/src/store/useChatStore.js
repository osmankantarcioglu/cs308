// client/src/store/useChatStore.js
import { create } from "zustand";
import http from "../api/http";
import { io } from "socket.io-client";

let socketSingleton = null;

export const useChatStore = create((set, get) => ({
  // State
  conversations: [],
  activeId: null,                 // ✅ used by components
  currentConversation: null,      // ✅ kept for compatibility
  messages: [],
  customer: null,                 // ✅ for CustomerPanel
  socket: null,
  loading: false,
  error: null,

  // Socket
  initSocket: () => {
    if (socketSingleton) {
      if (!get().socket) set({ socket: socketSingleton });
      return;
    }
    const socket = io("http://localhost:3000", { withCredentials: true });
    socket.on("message:new", (msg) => {
      const { activeId, messages } = get();
      if (msg.conversationId === activeId) {
        set({ messages: [...messages, msg] });
      }
    });
    socketSingleton = socket;
    set({ socket });
  },

  // Conversations
  setConversations: (list) => set({ conversations: list }), // ✅ used by ChatList

  loadConversations: async () => {
    try {
      set({ loading: true, error: null });
      const res = await http.get("/support/conversations");
      set({ conversations: res.data, loading: false });
    } catch (e) {
      set({ error: "Could not load conversations", loading: false });
    }
  },

  // Select/activate a conversation (works for both APIs)
  setActive: async (id) => {                                  // ✅ used by ChatList
    const conv = get().conversations.find((c) => c.id === id) || { id };
    set({ activeId: id, currentConversation: conv, messages: [], customer: null });
    try {
      const res = await http.get(`/support/conversations/${id}/messages`);
      set({ messages: res.data });
    } catch (e) {
      set({ error: "Could not load messages" });
    }
  },

  // Keep your old method working too
  selectConversation: async (conv) => {
    set({ activeId: conv.id, currentConversation: conv, messages: [], customer: null });
    try {
      const res = await http.get(`/support/conversations/${conv.id}/messages`);
      set({ messages: res.data });
    } catch (e) {
      set({ error: "Could not load messages" });
    }
  },

  // Messages helpers
  setMessages: (m) => set({ messages: m }),                   // ✅ used by ChatWindow
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })), // ✅ used by Composer

  // Customer context
  setCustomer: (c) => set({ customer: c }),                   // ✅ used by CustomerPanel

  // Send message (REST; socket echo handled by backend)
  sendMessage: async (text, attachments = []) => {
    const { activeId } = get();
    if (!activeId) return;
    await http.post("/support/message", {
      conversationId: activeId,
      text,
      attachments,
      senderType: "agent",
    });
  },
}));