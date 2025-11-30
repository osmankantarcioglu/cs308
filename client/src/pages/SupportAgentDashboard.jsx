import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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

export default function SupportAgentDashboard() {
  const { user, token, logout } = useAuth();
  const [queue, setQueue] = useState([]);
  const [claimedChats, setClaimedChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState(null);
  const [reply, setReply] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingClaimed, setLoadingClaimed] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("queue"); // "queue" or "claimed"
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const authorizedHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const fetchQueue = useCallback(async () => {
    if (!token) return;
    setLoadingQueue(true);
    setError("");
    try {
      const res = await fetch(`${CHAT_API_BASE}/queue`, {
        headers: authorizedHeaders,
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load queue");
      }
      const data = await res.json();
      setQueue(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingQueue(false);
    }
  }, [authorizedHeaders, token]);

  const fetchClaimedChats = useCallback(async () => {
    if (!token) return;
    setLoadingClaimed(true);
    try {
      const res = await fetch(`${CHAT_API_BASE}/claimed`, {
        headers: authorizedHeaders,
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load claimed chats");
      }
      const data = await res.json();
      setClaimedChats(data.data || []);
    } catch (err) {
      console.error("Failed to load claimed chats:", err.message);
    } finally {
      setLoadingClaimed(false);
    }
  }, [authorizedHeaders, token]);

  // Poll queue and claimed chats every 7 seconds (same as customer chat)
  useEffect(() => {
    fetchQueue();
    fetchClaimedChats();
    const interval = setInterval(() => {
      fetchQueue();
      fetchClaimedChats();
    }, 7000);
    return () => clearInterval(interval);
  }, [fetchQueue, fetchClaimedChats]);

  const scrollToBottom = useCallback((force = false) => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    
    // Only scroll if user is near bottom or if forced (e.g., after sending a message)
    if (force || isNearBottom) {
      // Scroll the container itself, not the entire page
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  const fetchMessages = useCallback(async (chatId, isInitialLoad = false) => {
    if (!chatId || !token) return; // Don't make request if no token
    try {
      const res = await fetch(`${CHAT_API_BASE}/${chatId}/messages`, {
        headers: authorizedHeaders,
        cache: "no-store",
      });
      if (!res.ok) {
        // For 403 errors, log and try to understand the issue
        if (res.status === 403) {
          const errorData = await res.json().catch(() => ({}));
          console.warn("403 Forbidden when fetching messages:", errorData.error || "Unknown error");
          // Don't throw - just return silently to avoid breaking the UI
          return;
        }
        if (res.status === 404) {
          return;
        }
        const data = await res.json();
        throw new Error(data.error || "Failed to load chat");
      }
      const data = await res.json();
      setSelectedChat(data.data.chat);
      
      // Check if we have new messages by comparing IDs
      setMessages(prevMessages => {
        const newMessages = data.data.messages || [];
        const hasNewMessages = newMessages.length > prevMessages.length || 
          (newMessages.length > 0 && prevMessages.length > 0 && 
           newMessages[newMessages.length - 1]._id !== prevMessages[prevMessages.length - 1]._id);
        
        // Only auto-scroll on initial load or if new messages were added
        if (isInitialLoad || hasNewMessages) {
          setTimeout(() => {
            scrollToBottom(isInitialLoad);
          }, 100);
        }
        
        return newMessages;
      });
    } catch (err) {
      // Only set error for non-403/404 errors
      if (err.message && !err.message.includes("403") && !err.message.includes("404")) {
        console.warn("Chat fetch failed", err.message);
      }
    }
  }, [authorizedHeaders, scrollToBottom]);

  const loadChat = async (chatId) => {
    if (!chatId) return;
    setLoadingMessages(true);
    try {
      await fetchMessages(chatId, true); // Mark as initial load
      await fetchContext(chatId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Switch to claimed tab when a claimed chat is selected
  useEffect(() => {
    if (selectedChat?.claimed_by?.toString() === user?._id) {
      setActiveTab("claimed");
    }
  }, [selectedChat, user?._id]);

  // Poll messages for selected chat every 7 seconds (same as customer chat)
  useEffect(() => {
    if (!selectedChat?._id) return;
    
    // Initial fetch (marked as initial load)
    fetchMessages(selectedChat._id, true);
    
    // Set up polling interval (not initial load, so won't force scroll)
    const interval = setInterval(() => {
      if (selectedChat._id) {
        fetchMessages(selectedChat._id, false);
      }
    }, 7000);
    
    return () => clearInterval(interval);
  }, [selectedChat?._id, fetchMessages]);

  const fetchContext = async (chatId) => {
    try {
      const res = await fetch(`${CHAT_API_BASE}/${chatId}/context`, {
        headers: authorizedHeaders,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load context");
      }
      const data = await res.json();
      setContext(data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClaim = async (chatId) => {
    try {
      const res = await fetch(`${CHAT_API_BASE}/${chatId}/claim`, {
        method: "POST",
        headers: authorizedHeaders,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to claim chat");
      }
      // Refresh both queue and claimed chats
      await Promise.all([fetchQueue(), fetchClaimedChats()]);
      // Load the claimed chat
      loadChat(chatId);
      // Switch to claimed tab to show the claimed chat
      setActiveTab("claimed");
    } catch (err) {
      setError(err.message || "Failed to claim chat");
    }
  };

  const handleSendMessage = async () => {
    if (!reply && attachments.length === 0) return;
    if (!selectedChat) return;
    setSending(true);
    setError("");
    try {
      const preparedAttachments = await Promise.all(
        attachments.map((file) => fileToAttachment(file))
      );
      const res = await fetch(`${CHAT_API_BASE}/${selectedChat._id}/messages`, {
        method: "POST",
        headers: authorizedHeaders,
        body: JSON.stringify({
          sender_type: "agent",
          message: reply,
          attachments: preparedAttachments,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }
      
      const responseData = await res.json();
      const newMessage = responseData.data;

      // Clear input immediately for better UX
      setReply("");
      setAttachments([]);

      // Don't add message optimistically to avoid triggering scroll
      // Just refresh messages without forcing scroll
      
      // Wait a bit for the database to be fully updated, then refresh all messages and claimed chats
      setTimeout(async () => {
        // Refresh messages but don't force scroll
        await fetchMessages(selectedChat._id, false);
        // Refresh claimed chats to update last message preview (chat may have been auto-claimed)
        await fetchClaimedChats();
      }, 300);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
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

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-indigo-300">
              Support Desk
            </p>
            <h1 className="text-4xl font-extrabold">Live Chat Command</h1>
            <p className="text-slate-400 mt-2 max-w-xl">
              Claim conversations, reply in real time, and view every customer’s context
              without leaving the dashboard.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Signed in as</p>
            <p className="font-semibold text-lg">
              {user?.first_name} {user?.last_name}
            </p>
            <button
              onClick={handleLogout}
              className="mt-2 px-4 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-sm"
            >
              Sign out
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-rose-950/30 border border-rose-500/40 text-rose-200 px-4 py-3 rounded-2xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <section className="xl:col-span-4 bg-slate-900/80 rounded-3xl p-5 ring-1 ring-white/5 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Chats</h2>
              <button
                onClick={() => {
                  fetchQueue();
                  fetchClaimedChats();
                }}
                className="text-sm text-indigo-300 hover:text-indigo-200"
              >
                Refresh
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2">
              <button
                onClick={() => setActiveTab("queue")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === "queue"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Queue ({queue.length})
              </button>
              <button
                onClick={() => setActiveTab("claimed")}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === "claimed"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                My Chats ({claimedChats.length})
              </button>
            </div>

            {/* Queue Tab */}
            {activeTab === "queue" && (
              <>
                {loadingQueue ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500"></div>
                  </div>
                ) : queue.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">No waiting chats 🎉</p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {queue.map((chat) => (
                      <div
                        key={chat._id}
                        className={`p-4 rounded-2xl border border-white/5 hover:border-indigo-500/40 transition cursor-pointer ${
                          selectedChat?._id === chat._id ? "bg-slate-900" : "bg-slate-900/60"
                        }`}
                        onClick={() => loadChat(chat._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">
                              {chat.customer_name || chat.user_id?.first_name || "Guest"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {chat.customer_email || chat.user_id?.email || "Guest session"}
                            </p>
                          </div>
                          {chat.status === "active" && (
                            <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-200">
                              Waiting
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 mt-2 line-clamp-2">
                          {chat.last_message_preview || "No messages yet"}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaim(chat._id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                          >
                            Claim Chat
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              loadChat(chat._id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Claimed Chats Tab */}
            {activeTab === "claimed" && (
              <>
                {loadingClaimed ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500"></div>
                  </div>
                ) : claimedChats.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">No claimed chats yet. Claim a chat from the queue to start.</p>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {claimedChats.map((chat) => (
                      <div
                        key={chat._id}
                        className={`p-4 rounded-2xl border border-white/5 hover:border-indigo-500/40 transition cursor-pointer ${
                          selectedChat?._id === chat._id ? "bg-slate-900 border-indigo-500/40" : "bg-slate-900/60"
                        }`}
                        onClick={() => loadChat(chat._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">
                              {chat.customer_name || chat.user_id?.first_name || "Guest"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {chat.customer_email || chat.user_id?.email || "Guest session"}
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-200">
                            Claimed
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mt-2 line-clamp-2">
                          {chat.last_message_preview || "No messages yet"}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          Claimed {chat.claimed_at ? new Date(chat.claimed_at).toLocaleString() : "recently"}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            loadChat(chat._id);
                          }}
                          className="mt-3 w-full px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                        >
                          Open Chat
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="xl:col-span-5 bg-slate-900/80 rounded-3xl p-6 ring-1 ring-white/5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Conversation</h2>
                <p className="text-sm text-slate-400">
                  {selectedChat
                    ? selectedChat.customer_name || selectedChat.user_id?.first_name || "Guest"
                    : "Select a chat from the queue or claimed chats"}
                </p>
              </div>
              {selectedChat?.claimed_by && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-200">
                    Claimed by You
                  </span>
                  <span className="text-xs text-slate-400">
                    {selectedChat.claimed_at ? new Date(selectedChat.claimed_at).toLocaleString() : ""}
                  </span>
                </div>
              )}
            </div>
            <div 
              ref={messagesContainerRef}
              className="flex-1 bg-slate-950/40 rounded-2xl p-4 overflow-y-auto space-y-4 min-h-0"
              style={{ maxHeight: '400px' }}
            >
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-slate-500 text-sm text-center">No messages yet.</p>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`max-w-md rounded-2xl px-4 py-3 ${
                        msg.sender_type === "agent"
                          ? "bg-indigo-600/80 ml-auto text-right"
                          : "bg-slate-800/80"
                      }`}
                    >
                      {msg.message && <p className="text-sm">{msg.message}</p>}
                      {msg.attachments?.length > 0 && (
                        <div className="mt-2 space-y-1 text-xs">
                          {msg.attachments.map((att, index) => (
                            <button
                              key={`${msg._id}-${index}`}
                              onClick={() => handleDownloadAttachment(att, `attachment-${index + 1}`)}
                              className="underline text-indigo-200 hover:text-indigo-100 block text-left"
                            >
                              {att.filename || `Attachment ${index + 1}`}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] uppercase tracking-widest mt-2 opacity-60">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            <div className="mt-4 space-y-3">
              <textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Type your reply..."
                disabled={!selectedChat}
              />
              <div className="flex items-center justify-between">
                <input
                  type="file"
                  multiple
                  onChange={(e) => setAttachments(Array.from(e.target.files))}
                  className="text-xs text-slate-400"
                  disabled={!selectedChat}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !selectedChat}
                  className="px-4 py-2 bg-indigo-600 rounded-xl font-semibold hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </div>
          </section>

          <section className="xl:col-span-3 bg-slate-900/80 rounded-3xl p-6 ring-1 ring-white/5 space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Customer Context</h2>
              <p className="text-slate-400 text-sm">Orders, deliveries, wishlist</p>
            </div>
            {!context ? (
              <p className="text-slate-500 text-sm">Select a chat to view context.</p>
            ) : (
              <div className="space-y-6 text-sm text-slate-300">
                <div>
                  <h3 className="font-semibold text-white mb-2">Recent Orders</h3>
                  {context.orders?.length ? (
                    <div className="space-y-2">
                      {context.orders.map((order) => (
                        <div key={order._id} className="bg-slate-950/40 rounded-xl p-3">
                          <p className="text-white text-sm font-semibold">{order.order_number}</p>
                          <p className="text-xs text-slate-500">
                            {order.items?.length} items • ${order.total_amount?.toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(order.order_date).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No orders found.</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Delivery Status</h3>
                  {context.deliveries?.length ? (
                    <div className="space-y-2">
                      {context.deliveries.map((delivery) => (
                        <div key={delivery._id} className="bg-slate-950/40 rounded-xl p-3">
                          <p className="text-sm font-semibold text-white">
                            {delivery.product_id?.name || "Product"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Qty: {delivery.quantity}
                          </p>
                          <p className={`text-xs mt-1 font-semibold ${
                            delivery.status === "delivered" ? "text-emerald-400" :
                            delivery.status === "in-transit" ? "text-blue-400" :
                            delivery.status === "pending" ? "text-amber-400" :
                            "text-rose-400"
                          }`}>
                            Status: {delivery.status?.charAt(0).toUpperCase() + delivery.status?.slice(1).replace("-", " ") || "Unknown"}
                          </p>
                          {delivery.delivery_date && (
                            <p className="text-xs text-slate-500 mt-1">
                              Delivered: {new Date(delivery.delivery_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No deliveries found.</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Wishlist</h3>
                  {context.wishlist?.length ? (
                    <div className="space-y-2">
                      {context.wishlist.map((item, index) => (
                        <div key={`${item.product_id?._id || index}`} className="bg-slate-950/40 rounded-xl p-3">
                          <p className="text-sm font-semibold text-white">
                            {item.product_id?.name || "Product"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Added {new Date(item.added_at || item.createdAt || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No wishlist items.</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Cart Contents</h3>
                  {context.cart?.items?.length ? (
                    <div className="space-y-2">
                      {context.cart.items.map((item, index) => (
                        <div key={`${item.product_id?._id || index}`} className="bg-slate-950/40 rounded-xl p-3">
                          <p className="text-sm font-semibold text-white">
                            {item.product_id?.name || "Product"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Qty: {item.quantity} • ${item.product_id?.price ? (item.product_id.price * item.quantity).toFixed(2) : "0.00"}
                          </p>
                        </div>
                      ))}
                      <div className="mt-2 pt-2 border-t border-slate-700">
                        <p className="text-xs text-slate-400">
                          Total: ${context.cart.total_amount?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Cart is empty.</p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}


