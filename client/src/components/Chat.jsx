import { useState, useEffect, useRef } from "react";
import socket from "../socket";
import "./Chat.css";

export default function Chat({ roomId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null); // auto-scroll anchor

  useEffect(() => {
    socket.on("chat:message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => socket.off("chat:message");
  }, []);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    socket.emit("chat:message", { roomId, message: trimmed });
    setInput("");
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="chat">
      <p className="chat__label">chat</p>

      <div className="chat__messages">
        {messages.length === 0 && (
          <p className="chat__empty">no messages yet.</p>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.userId === currentUser?.id;
          return (
            <div
              key={i}
              className={`chat-msg ${isOwn ? "chat-msg--own" : ""}`}
            >
              {!isOwn && (
                <span className="chat-msg__user">{msg.username}</span>
              )}
              <div className="chat-msg__bubble">{msg.message}</div>
              <span className="chat-msg__time">{formatTime(msg.timestamp)}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chat__form" onSubmit={send}>
        <input
          className="input chat__input"
          placeholder="message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(e)}
        />
        <button className="btn btn-primary chat__send" type="submit">↑</button>
      </form>
    </div>
  );
}