import { useRef, useState } from "react";
import socket from "../../lib/socket";
import http from "../../api/http";
import { useChatStore } from "../../store/useChatStore";

export default function Composer() {
  const { activeId, addMessage } = useChatStore((s) => ({
    activeId: s.activeId,
    addMessage: s.addMessage,
  }));

  const [text, setText] = useState("");
  const fileRef = useRef();

  const send = async () => {
    if (!activeId || (!text && !fileRef.current?.files?.length)) return;

    let attachments = [];
    if (fileRef.current?.files?.[0]) {
      const form = new FormData();
      form.append("file", fileRef.current.files[0]);
      const r = await http.post("/support/upload", form);
      attachments = [r.data];
      fileRef.current.value = "";
    }

    const payload = { conversationId: activeId, text, attachments, senderType: "agent" };

    // optimistic UI
    addMessage({ ...payload, id: "tmp_" + Math.random(), createdAt: new Date().toISOString() });

    socket.emit("message:send", payload);
    await http.post("/support/message", payload);
    setText("");
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        placeholder="Write a reply…"
        className="flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      <label className="cursor-pointer rounded-full border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
        <input type="file" ref={fileRef} className="hidden" /> 📎 Attach
      </label>
      <button
        onClick={send}
        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
      >
        Send
      </button>
    </div>
  );
}