import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [context, setContext] = useState(null);
  const [reply, setReply] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const loadChat = async (chatId) => {
    if (!chatId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`${CHAT_API_BASE}/${chatId}/messages`, {
        headers: authorizedHeaders,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load chat");
      }
      const data = await res.json();
      setSelectedChat(data.data.chat);
      setMessages(data.data.messages);
      await fetchContext(chatId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  };

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
      await fetch(`${CHAT_API_BASE}/${chatId}/claim`, {
        method: "POST",
        headers: authorizedHeaders,
      });
      fetchQueue();
      loadChat(chatId);
    } catch (err) {
      setError("Failed to claim chat");
    }
  };

  const handleSendMessage = async () => {
    if (!reply && attachments.length === 0) return;
    if (!selectedChat) return;
    setSending(true);
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
      setReply("");
      setAttachments([]);
      loadChat(selectedChat._id);
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Active Queue</h2>
              <button
                onClick={fetchQueue}
                className="text-sm text-indigo-300 hover:text-indigo-200"
              >
                Refresh
              </button>
            </div>
            {loadingQueue ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500"></div>
              </div>
            ) : queue.length === 0 ? (
              <p className="text-slate-500 text-sm">No waiting chats 🎉</p>
            ) : (
              <div className="space-y-3">
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
          </section>

          <section className="xl:col-span-5 bg-slate-900/80 rounded-3xl p-6 ring-1 ring-white/5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Conversation</h2>
                <p className="text-sm text-slate-400">
                  {selectedChat
                    ? selectedChat.customer_name || selectedChat.user_id?.first_name || "Guest"
                    : "Select a chat from the queue"}
                </p>
              </div>
              {selectedChat?.claimed_by && (
                <span className="text-xs text-lime-300">
                  Claimed at {new Date(selectedChat.claimed_at).toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex-1 bg-slate-950/40 rounded-2xl p-4 overflow-y-auto space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-500"></div>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-slate-500 text-sm text-center">No messages yet.</p>
              ) : (
                messages.map((msg) => (
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
                ))
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
                  <h3 className="font-semibold text-white mb-2">Deliveries</h3>
                  {context.deliveries?.length ? (
                    <div className="space-y-2">
                      {context.deliveries.map((delivery) => (
                        <div key={delivery._id} className="bg-slate-950/40 rounded-xl p-3">
                          <p className="text-sm font-semibold text-white">
                            {delivery.product_id?.name || "Product"}
                          </p>
                          <p className="text-xs text-slate-500">
                            Qty {delivery.quantity} • Status {delivery.status}
                          </p>
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
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}


