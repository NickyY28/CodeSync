import { useState, useRef } from "react";
import axios from "axios";
import socket from "../socket";
import "./FileTabs.css";

const LANG_COLORS = {
  javascript: "#f7df1e", typescript: "#3178c6",
  python: "#3572A5", css: "#563d7c",
  html: "#e34c26", go: "#00ADD8",
  rust: "#dea584", cpp: "#f34b7d",
};

export default function FileTabs({ files, activeFile, onSwitch, roomId, onFilesChange }) {
  const [renamingId, setRenamingId] = useState(null);  // which file is being renamed
  const [renameVal, setRenameVal] = useState("");
  const [adding, setAdding] = useState(false);         // showing new file input
  const [newName, setNewName] = useState("");
  const renameInputRef = useRef(null);

  // ── New file ──────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const { data } = await axios.post(`/api/rooms/${roomId}/files`, {
        name: newName.trim(),
      });
      onFilesChange([...files, data]);
      onSwitch(data);
      socket.emit("file:created", { roomId, file: data });
      setNewName("");
      setAdding(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create file");
    }
  };

  // ── Rename — start ────────────────────────────────────
  const startRename = (file) => {
    setRenamingId(file._id);
    setRenameVal(file.name);
    // Focus input on next render
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  // ── Rename — commit ───────────────────────────────────
  const commitRename = async (fileId) => {
    if (!renameVal.trim()) { setRenamingId(null); return; }
    try {
      const { data } = await axios.patch(
        `/api/rooms/${roomId}/files/${fileId}`,
        { name: renameVal.trim() }
      );
      onFilesChange(files.map((f) => (f._id === fileId ? data : f)));
      if (activeFile?._id === fileId) onSwitch(data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to rename");
    }
    setRenamingId(null);
  };

  // ── Delete ────────────────────────────────────────────
  const handleDelete = async (e, file) => {
    e.stopPropagation(); // don't trigger tab switch
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    try {
      await axios.delete(`/api/rooms/${roomId}/files/${file._id}`);
      const updated = files.filter((f) => f._id !== file._id);
      onFilesChange(updated);
      // If we deleted the active file, switch to first remaining
      if (activeFile?._id === file._id) onSwitch(updated[0]);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="filetabs">
      {files.map((file) => (
        <div
          key={file._id}
          className={`filetab ${activeFile?._id === file._id ? "active" : ""}`}
          onClick={() => renamingId !== file._id && onSwitch(file)}
          onDoubleClick={() => startRename(file)}  // double-click to rename
          title="double-click to rename"
        >
          <span
            className="filetab__dot"
            style={{ background: LANG_COLORS[file.language] || "#888" }}
          />

          {/* Inline rename input — shows on double click */}
          {renamingId === file._id ? (
            <input
              ref={renameInputRef}
              className="filetab__rename-input"
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onBlur={() => commitRename(file._id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename(file._id);
                if (e.key === "Escape") setRenamingId(null);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="filetab__name">{file.name}</span>
          )}

          {/* Delete button — only shows on hover via CSS */}
          {files.length > 1 && renamingId !== file._id && (
            <button
              className="filetab__delete"
              onClick={(e) => handleDelete(e, file)}
              title="delete file"
            >
              ×
            </button>
          )}
        </div>
      ))}

      {/* New file input or + button */}
      {adding ? (
        <form onSubmit={handleAdd} className="filetab filetab--adding">
          <input
            autoFocus
            className="filetab__rename-input"
            placeholder="filename.js"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => { setAdding(false); setNewName(""); }}
            onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
          />
        </form>
      ) : (
        <button
          className="filetab filetab--add"
          onClick={() => setAdding(true)}
          title="new file"
        >
          +
        </button>
      )}
    </div>
  );
}