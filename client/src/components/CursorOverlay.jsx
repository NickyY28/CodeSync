import { useEffect, useState } from "react";
import "./CursorOverlay.css";

// Renders colored name tags for collaborators' cursors — never the local user.
export default function CursorOverlay({
  cursors,
  editorRef,
  containerRef,
  ownSocketId,
  ownUserId,
}) {
  const [positions, setPositions] = useState({});

  useEffect(() => {
    if (!editorRef.current || !containerRef.current) return;

    const editor = editorRef.current;

    const recalculate = () => {
      const next = {};
      for (const [socketId, cursor] of Object.entries(cursors)) {
        // Never show the local user's own remote cursor label
        if (socketId === ownSocketId) continue;
        if (ownUserId && cursor.userId === ownUserId) continue;
        if (!cursor.position) continue;

        const px = editor.getScrolledVisiblePosition({
          lineNumber: cursor.position.lineNumber,
          column: cursor.position.column,
        });

        if (px) {
          next[socketId] = {
            ...cursor,
            top: px.top,
            left: px.left,
          };
        }
      }
      setPositions(next);
    };

    recalculate();

    const disposable = editor.onDidScrollChange(recalculate);
    return () => disposable.dispose();
  }, [cursors, editorRef, containerRef, ownSocketId, ownUserId]);

  return (
    <div className="cursor-overlay">
      {Object.entries(positions).map(([socketId, cursor]) => (
        <div
          key={socketId}
          className="remote-cursor"
          style={{ top: cursor.top, left: cursor.left }}
        >
          <div
            className="remote-cursor__line"
            style={{ background: cursor.color }}
          />
          <div
            className="remote-cursor__label"
            style={{ background: cursor.color }}
          >
            {cursor.username}
          </div>
        </div>
      ))}
    </div>
  );
}
