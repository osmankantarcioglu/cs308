// client/src/pages/SupportAgentPage.jsx
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const http = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

export default function SupportAgentPage() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const endRef = useRef(null);
  const socketRef = useRef(null);

  // Mount: load conversations once & init socket once
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await http.get("/support/conversations");
        if (!cancelled) setConversations(res.data || []);
      } catch (e) {
        console.error("Failed to load conversations", e);
      }
    })();

    // single socket instance
    socketRef.current = io("http://localhost:3000", { withCredentials: true });
    const onNew = (msg) => {
      setMessages((prev) => (msg.conversationId === activeId ? [...prev, msg] : prev));
    };
    socketRef.current.on("message:new", onNew);

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.off("message:new", onNew);
        socketRef.current.close();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // When selecting a conversation, fetch its messages
  const selectConversation = async (id) => {
    setActiveId(id);
    try {
      const res = await http.get(`/support/conversations/${id}/messages`);
      setMessages(res.data || []);
    } catch (e) {
      console.error("Failed to load messages", e);
      setMessages([]);
    }
  };

  // Send message (text + optional one file)
  const send = async (e) => {
    e.preventDefault();
    if (!activeId || (!input.trim() && !file)) return;

    let attachments = [];
    try {
      if (file) {
        const form = new FormData();
        form.append("file", file);
        const up = await http.post("/support/upload", form);
        attachments = [up.data];
        setFile(null);
      }

      const payload = {
        conversationId: activeId,
        text: input.trim(),
        attachments,
        senderType: "agent",
      };

      // optimistic add
      const optimistic = {
        ...payload,
        id: "tmp_" + Math.random().toString(36).slice(2),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      // socket echo for other clients + persist via API
      socketRef.current?.emit("message:send", payload);
      await http.post("/support/message", payload);

      setInput("");
    } catch (e) {
      console.error("Failed to send", e);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Left: Conversation list */}
      <aside className="w-72 border-r bg-white overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <p className="text-xs text-gray-500">Sprint-1 demo</p>
        </div>

        {conversations.length === 0 && (
          <div className="p-4 text-sm text-gray-500">No conversations yet.</div>
        )}

        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => selectConversation(c.id)}
            className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 ${
              activeId === c.id ? "bg-indigo-50" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">#{c.id}</div>
              <span className="text-[10px] rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">
                {c.status || "open"}
              </span>
            </div>
            <div className="text-xs text-gray-500 line-clamp-1">{c.lastMessage || "—"}</div>
          </button>
        ))}
      </aside>

      {/* Right: Chat */}
      <section className="flex-1 flex flex-col">
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            <header className="p-4 border-b bg-white">
              <div className="font-semibold">Chat #{activeId}</div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-sm text-gray-500">No messages yet. Say hi! 👋</div>
              )}
              {messages.map((m) => {
                const mine = m.senderType === "agent";
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[72%] px-3 py-2 rounded-md ${
                        mine ? "bg-blue-600 text-white" : "bg-white border"
                      }`}
                    >
                      {m.text && <div className="text-sm">{m.text}</div>}
                      {m.attachments?.map((a) => (
                        <a
                          key={a.id}
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`mt-1 block text-xs underline ${
                            mine ? "text-blue-100" : "text-blue-700"
                          }`}
                        >
                          {a.name}
                        </a>
                      ))}
                      <div className={`mt-1 text-[10px] ${mine ? "text-blue-100/80" : "text-gray-500"}`}>
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Composer */}
            <form onSubmit={send} className="p-3 border-t bg-white flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 border rounded-l-md px-3 py-2"
                placeholder="Type a message…"
              />
              <label className="border px-3 py-2 text-sm rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                📎 Attach
              </label>
              <button type="submit" className="bg-blue-600 text-white px-4 rounded-md hover:bg-blue-700">
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}