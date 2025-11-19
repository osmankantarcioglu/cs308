import { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const API_ORIGIN = "http://localhost:3000";
const CHAT_API_BASE = `${API_ORIGIN}/chats`;

const fileToAttachment = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        filename: file.name,
        mimetype: file.type,
        size: file.size,
        data: reader.result,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const createSessionId = () => {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export default function CustomerChatWidget() {
  const { user, token } = useAuth();
  const storedUser = useMemo(() => {
    try {
      const cached = localStorage.getItem("user");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }, []);

  // Show widget for guests (no user) and customers only
  // Hide for admins and support agents
  const effectiveRole = user?.role ?? storedUser?.role ?? null;
  const allowedToShow = !effectiveRole || effectiveRole === "customer";

  // Always show for guests and customers
  if (!allowedToShow) {
    return null;
  }

  return <CustomerChatWidgetBody user={user} token={token} />;
}

function CustomerChatWidgetBody({ user, token }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [chatId, setChatId] = useState(() => localStorage.getItem("chatId"));
  const [chatOwner, setChatOwner] = useState(() => localStorage.getItem("chatOwner"));
  const [sessionId, setSessionId] = useState(() => {
    const existing = localStorage.getItem("chatSessionId");
    if (existing) return existing;
    const fresh = createSessionId();
    localStorage.setItem("chatSessionId", fresh);
    return fresh;
  });
  const [contact, setContact] = useState({
    name: user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "",
    email: user?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatSessionBinding, setChatSessionBinding] = useState(
    () => localStorage.getItem("chatSessionBinding") || null
  );
  
  // Refs to prevent infinite loops
  const fetchingLatestChat = useRef(false);
  const hasFetchedInitialChat = useRef(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const headers = useMemo(() => {
    const base = { "Content-Type": "application/json" };
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const clearChatState = () => {
    localStorage.removeItem("chatId");
    localStorage.removeItem("chatOwner");
    localStorage.removeItem("chatSessionBinding");
    setChatId(null);
    setMessages([]);
    setChatOwner(null);
    setChatSessionBinding(null);
  };

  useEffect(() => {
    setContact({
      name: user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "",
      email: user?.email || "",
    });
  }, [user]);

  const getBindingSession = () => chatSessionBinding || sessionId;

  const shouldUseSession = (owner = chatOwner) => {
    const binding = getBindingSession();
    return !!binding && (!user || (owner && owner.startsWith("guest")));
  };

  const fetchMessages = async (currentChatId) => {
    if (!currentChatId) return;
    try {
      // Only send session_id for guest users, not for authenticated users
      const bindingSession = getBindingSession();
      const needsSession = !user && bindingSession; // Only for guests
      const query = needsSession && bindingSession ? `?session_id=${bindingSession}` : "";
      const res = await fetch(`${CHAT_API_BASE}/${currentChatId}/messages${query}`, {
        headers,
        cache: "no-store",
      });
      if (res.status === 403 || res.status === 404) {
        // Don't clear chat state on 403/404 - just log the error
        // The chat might be valid but the user doesn't have access yet
        console.warn("Chat access denied or not found");
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      const fetchedMessages = data.data?.messages || [];
      console.log(`Fetched ${fetchedMessages.length} messages for chat ${currentChatId}`);
      setMessages(fetchedMessages);
      
      // Auto-scroll to bottom after messages are loaded
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (err) {
      console.warn("Chat fetch failed", err.message);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    let currentOwner = null;
    if (user) {
      currentOwner = `user:${user._id}`;
    } else if (sessionId) {
      currentOwner = `guest:${sessionId}`;
    }

    if (currentOwner && chatOwner && chatOwner !== currentOwner) {
      clearChatState();
    }

    if (currentOwner && chatOwner !== currentOwner) {
      setChatOwner(currentOwner);
      localStorage.setItem("chatOwner", currentOwner);
    }
  }, [user, sessionId, chatOwner]);

  useEffect(() => {
    // Only fetch when widget is open and we don't have a chatId yet
    if (!isOpen || fetchingLatestChat.current || hasFetchedInitialChat.current || chatId) {
      return;
    }

    const fetchLatestChat = async () => {
      // Prevent concurrent fetches
      if (fetchingLatestChat.current) return;
      fetchingLatestChat.current = true;
      hasFetchedInitialChat.current = true;

      try {
        // Build query string for session_id if guest user
        const bindingSession = chatSessionBinding || sessionId;
        const queryParams = new URLSearchParams();
        if (!user && bindingSession) {
          queryParams.append('session_id', bindingSession);
        }
        const queryString = queryParams.toString();
        const url = `${CHAT_API_BASE}/me/latest${queryString ? `?${queryString}` : ''}`;
        
        const res = await fetch(url, {
          headers,
          cache: "no-store",
        });
        if (!res.ok) {
          fetchingLatestChat.current = false;
          hasFetchedInitialChat.current = false;
          return;
        }
        const data = await res.json();
        if (data.data?.chat) {
          const chat = data.data.chat;
          let ownerKey = null;
          if (chat.user_id) {
            ownerKey = `user:${chat.user_id}`;
          } else if (chat.session_id) {
            ownerKey = `guest:${chat.session_id}`;
            // Only update sessionId if it's different and we don't have a user
            if (chat.session_id !== sessionId && !user) {
              localStorage.setItem("chatSessionId", chat.session_id);
              setSessionId(chat.session_id);
            }
          } else if (user) {
            ownerKey = `user:${user._id}`;
          } else if (sessionId) {
            ownerKey = `guest:${sessionId}`;
          }

          const newChatId = chat._id;
          setChatId(newChatId);
          if (ownerKey) {
            setChatOwner(ownerKey);
            localStorage.setItem("chatOwner", ownerKey);
          }
          if (chat.session_id && !user) {
            setChatSessionBinding(chat.session_id);
            localStorage.setItem("chatSessionBinding", chat.session_id);
          } else if (user) {
            setChatSessionBinding(null);
            localStorage.removeItem("chatSessionBinding");
          }
          localStorage.setItem("chatId", newChatId);
          setMessages(data.data.messages || []);
        }
      } catch (err) {
        console.warn("Failed to load existing chat", err.message);
        hasFetchedInitialChat.current = false;
      } finally {
        fetchingLatestChat.current = false;
      }
    };

    // Fetch latest chat for both authenticated users and guests
    if (user && token) {
      // Authenticated user
      fetchLatestChat();
    } else if (sessionId) {
      // Guest user with session
      fetchLatestChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?._id, token, chatId]);

  useEffect(() => {
    if (!chatId) return;
    
    // Initial fetch
    fetchMessages(chatId);
    
    // Set up polling interval
    const interval = setInterval(() => {
      if (chatId) {
        fetchMessages(chatId);
      }
    }, 7000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message && attachments.length === 0) return;

    const messageText = message;
    const messageAttachments = attachments;
    
    setLoading(true);
    setError("");

    try {
      const preparedAttachments = await Promise.all(messageAttachments.map((file) => fileToAttachment(file)));

      const bindingSession = getBindingSession();
      const includeSession = shouldUseSession();

      if (!chatId) {
        const payload = {
          customer_email: user?.email || contact.email,
          customer_name: user
            ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
            : contact.name,
          message,
          attachments: preparedAttachments,
        };

        if (includeSession && bindingSession) {
          payload.session_id = bindingSession;
        }

        const response = await fetch(`${CHAT_API_BASE}/start`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Unable to start chat");
        }

        const data = await response.json();
        const chatData = data.data.chat;
        const newChatId = chatData._id;
        const newOwner = chatData.user_id
          ? `user:${chatData.user_id}`
          : chatData.session_id
          ? `guest:${chatData.session_id}`
          : user
          ? `user:${user._id}`
          : sessionId
          ? `guest:${sessionId}`
          : null;
        setChatId(newChatId);
        if (newOwner) {
          setChatOwner(newOwner);
          localStorage.setItem("chatOwner", newOwner);
        }
        if (chatData.session_id) {
          setChatSessionBinding(chatData.session_id);
          localStorage.setItem("chatSessionBinding", chatData.session_id);
        } else {
          setChatSessionBinding(null);
          localStorage.removeItem("chatSessionBinding");
        }
        localStorage.setItem("chatId", newChatId);
        
        // Clear input after successful send
        setMessage("");
        setAttachments([]);
        
        // Add the new message to state immediately
        if (data.data.message) {
          setMessages([data.data.message]);
        }
        
        // Immediately fetch all messages to ensure we have the full chat history
        setTimeout(async () => {
          await fetchMessages(newChatId);
        }, 300);
        
        // Reset fetch flag when new chat is created
        hasFetchedInitialChat.current = true;
        
        // Scroll to bottom
        setTimeout(() => {
          scrollToBottom();
        }, 200);
      } else {
        const payload = {
          sender_type: "customer",
          message,
          attachments: preparedAttachments,
        };

        if (includeSession && bindingSession) {
          payload.session_id = bindingSession;
        }

        const response = await fetch(`${CHAT_API_BASE}/${chatId}/messages`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Unable to send message");
        }

        const responseData = await response.json();
        const newMessage = responseData.data;

        // Clear input immediately for better UX
        setMessage("");
        setAttachments([]);

        // Optimistically add the new message to the state immediately
        if (newMessage) {
          setMessages(prevMessages => [...prevMessages, newMessage]);
        }

        // Wait a bit for the database to be fully updated, then refresh all messages
        setTimeout(async () => {
          await fetchMessages(chatId);
        }, 300);
        
        // Ensure scroll to bottom after sending
        setTimeout(() => {
          scrollToBottom();
        }, 200);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachment, fallbackName) => {
    try {
      const filename = attachment.filename || fallbackName || "attachment";

      if (attachment.data) {
        const [meta, base64Data] = attachment.data.split(",");
        const mimeMatch = meta?.match(/data:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      }

      const fileUrl = attachment.path?.startsWith("http")
        ? attachment.path
        : `${API_ORIGIN}${attachment.path}`;

      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error("Failed to download attachment");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err.message || "Unable to download attachment");
    }
  };

  const handleToggleChat = () => {
    setIsOpen(prev => !prev);
    // Reset fetch flag when opening chat to allow fetching if needed
    if (!isOpen) {
      hasFetchedInitialChat.current = false;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {!isOpen ? (
        <button
          onClick={handleToggleChat}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl shadow-lg shadow-orange-500/40 hover:shadow-orange-500/60 transition-all flex items-center gap-2 font-medium text-sm md:text-base"
          aria-label="Contact Us - Open Live Chat"
        >
          <span>Contact Us</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" />
          </svg>
        </button>
      ) : (
        <div className="w-80 md:w-96 h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div>
              <p className="font-semibold text-sm">TechHub Support</p>
              <p className="text-xs text-indigo-100">Usually replies in under 2 minutes</p>
            </div>
            <button onClick={handleToggleChat} className="text-white/80 hover:text-white">
              ✕
            </button>
          </div>

          {!user && !chatId && (
            <div className="px-4 py-3 bg-indigo-50 text-xs text-indigo-800 flex-shrink-0">
              Already a customer? Drop your name and email so we can follow up on your case.
            </div>
          )}

          <div 
            ref={messagesContainerRef}
            className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50 min-h-0"
            style={{ maxHeight: '400px' }}
          >
            {messages.length === 0 ? (
              <p className="text-center text-sm text-slate-500">
                Start a conversation and a support agent will join shortly.
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    msg.sender_type === "customer"
                      ? "ml-auto bg-indigo-600 text-white"
                      : "bg-white shadow text-gray-800"
                  }`}
                >
                  {msg.message && <p>{msg.message}</p>}
                      {msg.attachments?.length > 0 && (
                        <div className="mt-2 space-y-1 text-xs underline">
                          {msg.attachments.map((att, index) => (
                            <button
                              key={`${msg._id}-${index}`}
                              onClick={() => handleDownloadAttachment(att, `attachment-${index + 1}`)}
                              className={`block text-left ${
                                msg.sender_type === "customer"
                                  ? "text-indigo-200 hover:text-indigo-100"
                                  : "text-indigo-500 hover:text-indigo-400"
                              }`}
                            >
                              {att.filename || `Attachment ${index + 1}`}
                            </button>
                          ))}
                        </div>
                      )}
                  <p className="text-[10px] uppercase tracking-widest mt-1 opacity-60">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-100 p-4 bg-white space-y-3">
            {!user && (
              <div className="space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Your name"
                  value={contact.name}
                  onChange={(e) => setContact((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={contact.email}
                  onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-between text-xs">
              <input
                type="file"
                multiple
                onChange={(e) => setAttachments(Array.from(e.target.files))}
                className="text-slate-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? "Sending..." : chatId ? "Send" : "Start Chat"}
              </button>
            </div>
            {error && <p className="text-xs text-rose-500">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}