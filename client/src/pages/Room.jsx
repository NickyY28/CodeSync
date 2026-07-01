import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import axios from "axios";
import socket, { setActiveRoomId, leaveActiveRoom } from "../socket";
import { useAuth } from "../context/AuthContext";
import Filetabs from "../components/FileTabs";
import UserList from "../components/UserList";
import Chat from "../components/Chat";
import CursorOverlay from "../components/CursorOverlay";
import OutputPanel from "../components/OutputPanel";
import "./Room.css";

export default function Room() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  const suppressCursorEmit = useRef(false);
  const pendingCodeRef = useRef(null);
  const activeFileRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [saveStatus, setSaveStatus] = useState("saved");
  const [copied, setCopied] = useState(false);

  activeFileRef.current = activeFile;

  const mergeFileContent = useCallback((fileId, content) => {
    const id = String(fileId);
    setFiles((prev) =>
      prev.map((f) => (String(f._id) === id ? { ...f, content } : f))
    );
    setActiveFile((prev) =>
      prev && String(prev._id) === id ? { ...prev, content } : prev
    );
  }, []);

  const applyCodeToEditor = useCallback((code) => {
    if (editorRef.current) {
      isRemoteUpdate.current = true;
      suppressCursorEmit.current = true;
      editorRef.current.setValue(code);
      isRemoteUpdate.current = false;
      pendingCodeRef.current = null;
      requestAnimationFrame(() => {
        suppressCursorEmit.current = false;
      });
    } else {
      pendingCodeRef.current = code;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const onRoomState = ({ code, users: roomUsers, files: filesMap, activeFileId }) => {
      setUsers(roomUsers);

      setFiles((prev) => {
        const updated = filesMap
          ? prev.map((f) => ({
              ...f,
              content: filesMap[f._id] ?? f.content ?? "",
            }))
          : prev;

        if (activeFileId) {
          const active = updated.find((f) => f._id === activeFileId);
          if (active) {
            setActiveFile(active);
            applyCodeToEditor(active.content ?? "");
          }
        } else if (code !== undefined) {
          applyCodeToEditor(code);
        }

        return updated;
      });
    };

    const onUserJoined = ({ users: roomUsers }) => setUsers(roomUsers);

    const onUserLeft = ({ users: roomUsers, socketId }) => {
      setUsers(roomUsers);
      setCursors((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };

    const onCodeUpdate = ({ fileId, code }) => {
      const id = String(fileId);
      mergeFileContent(id, code);
      if (String(activeFileRef.current?._id) !== id || !editorRef.current) return;

      isRemoteUpdate.current = true;
      suppressCursorEmit.current = true;
      const position = editorRef.current.getPosition();
      editorRef.current.setValue(code);
      editorRef.current.setPosition(position);
      isRemoteUpdate.current = false;
      requestAnimationFrame(() => {
        suppressCursorEmit.current = false;
      });
    };

    const onCursorUpdate = ({ socketId, userId, username, color, position }) => {
      setCursors((prev) => ({
        ...prev,
        [socketId]: { userId, username, color, position },
      }));
    };

    const onFileCreated = ({ file }) => {
      setFiles((prev) =>
        prev.some((f) => f._id === file._id) ? prev : [...prev, file]
      );
    };

    const onFileChanged = ({ fileId, code, language, name }) => {
      setFiles((prev) => {
        const exists = prev.some((f) => f._id === fileId);
        if (exists) {
          return prev.map((f) =>
            f._id === fileId ? { ...f, language, content: code, name: name || f.name } : f
          );
        }
        return [...prev, { _id: fileId, name: name || "untitled", language, content: code }];
      });

      const nextActive = {
        _id: fileId,
        name: name || activeFileRef.current?.name || "untitled",
        language,
        content: code,
      };
      setActiveFile(nextActive);
      applyCodeToEditor(code);
    };

    const onCodeSaved = () => setSaveStatus("saved");
    const onCodeSaveError = () => setSaveStatus("unsaved");

    socket.on("room:state", onRoomState);
    socket.on("room:user-joined", onUserJoined);
    socket.on("room:user-left", onUserLeft);
    socket.on("code:update", onCodeUpdate);
    socket.on("cursor:update", onCursorUpdate);
    socket.on("file:created", onFileCreated);
    socket.on("file:changed", onFileChanged);
    socket.on("code:saved", onCodeSaved);
    socket.on("code:save-error", onCodeSaveError);

    const init = async () => {
      try {
        const [{ data: roomData }, { data: filesData }] = await Promise.all([
          axios.get(`/api/rooms/${roomId}`),
          axios.get(`/api/rooms/${roomId}/files`),
        ]);
        if (cancelled) return;

        setRoom(roomData);
        setFiles(filesData);
        setActiveFile(filesData[0]);

        if (filesData[0]?.content) {
          pendingCodeRef.current = filesData[0].content;
        }

        setActiveRoomId(roomId);
      } catch {
        if (!cancelled) navigate("/");
      }
    };

    init();

    return () => {
      cancelled = true;
      socket.off("room:state", onRoomState);
      socket.off("room:user-joined", onUserJoined);
      socket.off("room:user-left", onUserLeft);
      socket.off("code:update", onCodeUpdate);
      socket.off("cursor:update", onCursorUpdate);
      socket.off("file:created", onFileCreated);
      socket.off("file:changed", onFileChanged);
      socket.off("code:saved", onCodeSaved);
      socket.off("code:save-error", onCodeSaveError);
      leaveActiveRoom();
    };
  }, [roomId, navigate, applyCodeToEditor, mergeFileContent]);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    const initial =
      pendingCodeRef.current ?? activeFileRef.current?.content ?? "";
    if (initial) {
      isRemoteUpdate.current = true;
      suppressCursorEmit.current = true;
      editor.setValue(initial);
      isRemoteUpdate.current = false;
      pendingCodeRef.current = null;
      requestAnimationFrame(() => {
        suppressCursorEmit.current = false;
      });
    }

    editor.addAction({
      id: "save-file",
      label: "Save File",
      keybindings: [2048 | 49],
      run: () => handleSave(),
    });

    editor.onDidChangeCursorPosition(({ position }) => {
      if (isRemoteUpdate.current || suppressCursorEmit.current) return;
      socket.emit("cursor:move", { roomId, position });
    });
  };

  const handleCodeChange = useCallback((value) => {
    if (isRemoteUpdate.current || !activeFile?._id) return;
    setSaveStatus("unsaved");
    mergeFileContent(activeFile._id, value);
    socket.emit("code:change", { roomId, fileId: activeFile._id, code: value });
  }, [roomId, activeFile, mergeFileContent]);

  const handleSave = useCallback(() => {
    if (!activeFile?._id || !editorRef.current) return;
    setSaveStatus("saving");
    socket.emit("code:save", {
      roomId,
      fileId: activeFile._id,
      code: editorRef.current.getValue(),
    });
  }, [roomId, activeFile]);

  const handleFileSwitch = (file) => {
    const currentId = activeFileRef.current?._id;
    const currentCode = editorRef.current?.getValue() ?? "";

    if (currentId && currentCode !== undefined) {
      mergeFileContent(currentId, currentCode);
      socket.emit("code:change", { roomId, fileId: currentId, code: currentCode });
    }

    setActiveFile(file);
    applyCodeToEditor(file.content ?? "");
    socket.emit("file:change", { roomId, fileId: file._id });
  };

  const copyShareCode = () => {
    navigator.clipboard.writeText(room?.shareCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="room">
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

      <Filetabs
        files={files}
        activeFile={activeFile}
        onSwitch={handleFileSwitch}
        roomId={roomId}
        onFilesChange={setFiles}
      />

      <div className="room-body">
        <aside className="room-sidebar">
          <UserList users={users} currentUserId={user?.id} />
          <Chat roomId={roomId} currentUser={user} />
        </aside>

        <div className="room-editor-wrap" ref={containerRef}>
          <div style={{ height: "calc(100% - 220px)", position: "relative" }}>
            <Editor
              key={activeFile?._id}
              height="100%"
              language={activeFile?.language || "javascript"}
              theme="vs-dark"
              onChange={handleCodeChange}
              onMount={handleEditorMount}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
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
              ownSocketId={socket.id}
              ownUserId={user?.id}
            />
          </div>

          <OutputPanel
            getCode={() => editorRef.current?.getValue() || ""}
            language={activeFile?.language || "javascript"}
          />
        </div>
      </div>
    </div>
  );
}
