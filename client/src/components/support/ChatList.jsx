import { useEffect, useState } from "react";
import http from "../../api/http";
import { useChatStore } from "../../store/useChatStore";

const Status = ({ s }) => {
  const map = {
    open: "bg-emerald-50 text-emerald-700",
    waiting: "bg-amber-50 text-amber-700",
    closed: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[s] || map.closed}`}>
      {s || "open"}
    </span>
  );
};

export default function ChatList() {
  const { conversations, setConversations, setActive, activeId } = useChatStore((s) => ({
    conversations: s.conversations,
    setConversations: s.setConversations,
    setActive: s.setActive,
    activeId: s.activeId,
  }));

  const [filter, setFilter] = useState("open");
  const [q, setQ] = useState("");

  useEffect(() => {
    http.get("/support/conversations").then((r) => setConversations(r.data));
  }, [setConversations]);

  const items = conversations
    .filter((c) => (filter === "all" ? true : c.status === filter))
    .filter((c) =>
      q ? (c.lastMessage || "").toLowerCase().includes(q.toLowerCase()) || c.id.includes(q) : true
    );

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="flex gap-1 mb-2">
          {["open", "waiting", "closed", "all"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium border ${
                filter === s ? "bg-slate-900 text-white border-slate-900" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search chats..."
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={`w-full text-left px-3 py-3 border-b ${
              activeId === c.id ? "bg-indigo-50" : "hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">#{c.id}</div>
              <Status s={c.status} />
            </div>
            <div className="mt-1 line-clamp-1 text-xs text-slate-600">{c.lastMessage || "—"}</div>
          </button>
        ))}
        {!items.length && (
          <div className="p-6 text-center text-sm text-slate-500">No conversations found.</div>
        )}
      </div>
    </div>
  );
}