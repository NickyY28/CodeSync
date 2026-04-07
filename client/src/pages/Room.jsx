import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import axios from "axios";
import socket from "../socket";
import { useAuth } from "../context/AuthContext";
import Filetabs from "../components/FileTabs";
import UserList from "../components/UserList";
import Chat from "../components/Chat";
import CursorOverlay from "../components/CursorOverlay";
import "./Room.css";

export default function Room() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const editorRef = useRef(null);       // holds the Monaco editor instance
  const containerRef = useRef(null);    // the div wrapping Monaco — needed for cursor overlay positioning
  const isRemoteUpdate = useRef(false); // flag to block echo loop

  const [room, setRoom] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({}); // { socketId: { username, color, position } }
  const [saveStatus, setSaveStatus] = useState("saved"); // "saved" | "unsaved" | "saving"
  const [copied, setCopied] = useState(false);

  // ── 1. Fetch room + files from REST, then connect socket ──
  useEffect(() => {
    const init = async () => {
      try {
        // Load room metadata and its files via HTTP
        const [{ data: roomData }, { data: filesData }] = await Promise.all([
          axios.get(`/api/rooms/${roomId}`),
          axios.get(`/api/rooms/${roomId}/files`),
        ]);
        setRoom(roomData);
        setFiles(filesData);
        setActiveFile(filesData[0]);

        // Now connect socket and join room
        socket.connect();
        socket.emit("room:join", { roomId });
      } catch {
        navigate("/"); // room not found or unauthorized
      }
    };
    init();

    // Cleanup: leave room and disconnect socket when component unmounts
    return () => {
      socket.emit("room:leave", { roomId });
      socket.disconnect();
    };
  }, [roomId]);

  // ── 2. All socket listeners ───────────────────────────────
  useEffect(() => {
    // Server sends current code + users when we first join
    socket.on("room:state", ({ code, users }) => {
      setUsers(users);
      if (editorRef.current) {
        isRemoteUpdate.current = true;
        editorRef.current.setValue(code);
        isRemoteUpdate.current = false;
      }
    });

    // Someone else joined — update user list
    socket.on("room:user-joined", ({ users }) => setUsers(users));

    // Someone left — update user list + remove their cursor
    socket.on("room:user-left", ({ users, socketId }) => {
      setUsers(users);
      setCursors((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    // Another user typed — update editor
    socket.on("code:update", ({ code }) => {
      if (!editorRef.current) return;
      // Set flag BEFORE setValue so our onChange handler ignores it
      isRemoteUpdate.current = true;
      const position = editorRef.current.getPosition(); // save cursor pos
      editorRef.current.setValue(code);
      editorRef.current.setPosition(position);          // restore cursor pos
      isRemoteUpdate.current = false;
    });

    // Another user moved cursor
    socket.on("cursor:update", ({ socketId, username, color, position }) => {
      setCursors((prev) => ({
        ...prev,
        [socketId]: { username, color, position },
      }));
    });

    // Someone switched files — everyone follows
    socket.on("file:changed", ({ fileId, code, language }) => {
      setActiveFile((prev) => ({ ...prev, _id: fileId, language }));
      isRemoteUpdate.current = true;
      editorRef.current?.setValue(code);
      isRemoteUpdate.current = false;
    });

    // Save confirmed
    socket.on("code:saved", ({ savedBy }) => {
      setSaveStatus("saved");
    });

    return () => {
      // Always remove listeners on cleanup to avoid duplicates
      socket.off("room:state");
      socket.off("room:user-joined");
      socket.off("room:user-left");
      socket.off("code:update");
      socket.off("cursor:update");
      socket.off("file:changed");
      socket.off("code:saved");
    };
  }, []);

  // ── 4. Render ─────────────────────────────────────────────
  return (
    <div className="room">

      {/* Topbar */}
      <header className="room-topbar">
        <div className="room-topbar__left">
          <span className="room-logo">
            <span className="bracket">[</span>CS<span className="bracket">]</span>
          </span>
          <span className="room-name">{room?.name || "loading..."}</span>
        </div>

        <div className="room-topbar__center">
          <span className="save-status" data-status={saveStatus}>
            <span className="save-status__dot" />
            {saveStatus}
          </span>
        </div>

        <div className="room-topbar__right">
          <button className="share-btn" onClick={copyShareCode}>
            <span className="share-code">{room?.shareCode}</span>
            <span className="share-btn__label">{copied ? "copied!" : "copy code"}</span>
          </button>
          <button className="btn btn-ghost room-leave" onClick={() => navigate("/")}>
            ← leave
          </button>
        </div>
      </header>

      {/* File tabs */}
      <Filetabs
        files={files}
        activeFile={activeFile}
        onSwitch={handleFileSwitch}
      />

      {/* Main editor area */}
      <div className="room-body">

        {/* Sidebar — users + chat */}
        <aside className="room-sidebar">
          <UserList users={users} currentUserId={user?.id} />
          <Chat roomId={roomId} currentUser={user} />
        </aside>

        {/* Editor + cursor overlay */}
        <div className="room-editor-wrap" ref={containerRef}>
          <Editor
            height="100%"
            language={activeFile?.language || "javascript"}
            theme="vs-dark"
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              fontLigatures: true,
              minimap: { enabled: false },   // minimap wastes space, disable it
              scrollBeyondLastLine: false,
              renderLineHighlight: "all",
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              smoothScrolling: true,
              padding: { top: 16, bottom: 16 },
              lineNumbersMinChars: 3,
            }}
          />
          <CursorOverlay
            cursors={cursors}
            editorRef={editorRef}
            containerRef={containerRef}
          />
        </div>
      </div>
    </div>
  );
}