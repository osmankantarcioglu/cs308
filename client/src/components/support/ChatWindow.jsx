import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import http from "../../api/http";
import { useChatStore } from "../../store/useChatStore";

const socket = io("http://localhost:3000", { withCredentials: true });

export default function ChatWindow() {
  const { activeId, messages, setMessages, addMessage } = useChatStore((s) => ({
    activeId: s.activeId,
    messages: s.messages,
    setMessages: s.setMessages,
    addMessage: s.addMessage,
  }));

  const endRef = useRef();

  useEffect(() => {
    if (!activeId) return;
    http.get(`/support/conversations/${activeId}/messages`).then((r) => setMessages(r.data));
  }, [activeId, setMessages]);

  useEffect(() => {
    const onNew = (msg) => {
      if (msg.conversationId === activeId) addMessage(msg);
    };
    socket.on("message:new", onNew);
    return () => socket.off("message:new", onNew);
  }, [activeId, addMessage]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!activeId)
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-xl border bg-white/80 backdrop-blur px-4 py-3 text-slate-600 shadow-sm">
          Select a conversation to start
        </div>
      </div>
    );

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-white to-slate-50">
      {messages.map((m) => {
        const me = m.senderType === "agent";
        return (
          <div key={m.id} className={`flex ${me ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[72%] rounded-2xl px-3 py-2 shadow-sm ring-1 ring-black/5 ${
                me ? "bg-indigo-600 text-white" : "bg-white"
              }`}
            >
              {m.text && <div className="text-sm leading-relaxed">{m.text}</div>}
              {m.attachments?.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-1 block text-xs underline ${me ? "text-indigo-100" : "text-indigo-700"}`}
                >
                  {a.name}
                </a>
              ))}
              <div className={`mt-1 text-[10px] ${me ? "text-indigo-100/80" : "text-slate-500"}`}>
                {new Date(m.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}