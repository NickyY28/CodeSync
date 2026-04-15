import { useEffect, useState } from "react";
import "./CursorOverlay.css";

// This component renders colored name tags over the Monaco editor
// showing where each collaborator's cursor is in real time

export default function CursorOverlay({ cursors, editorRef, containerRef }) {
  const [positions, setPositions] = useState({});

  useEffect(() => {
    if (!editorRef.current || !containerRef.current) return;

    const editor = editorRef.current;

    // Convert Monaco line/column positions to pixel coordinates
    // Monaco exposes getScrolledVisiblePosition() for exactly this
    const recalculate = () => {
      const next = {};
      for (const [socketId, cursor] of Object.entries(cursors)) {
        if (!cursor.position) continue;

        // getScrolledVisiblePosition gives px coords relative to the editor DOM
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

    // Recalculate on scroll — cursors need to move with the editor content
    const disposable = editor.onDidScrollChange(recalculate);
    return () => disposable.dispose(); // Monaco uses .dispose() not removeListener
  }, [cursors, editorRef.current]);

  return (
    <div className="cursor-overlay">
      {Object.entries(positions).map(([socketId, cursor]) => (
        <div
          key={socketId}
          className="remote-cursor"
          style={{ top: cursor.top, left: cursor.left }}
        >
          {/* The blinking line */}
          <div
            className="remote-cursor__line"
            style={{ background: cursor.color }}
          />
          {/* The name tag above the cursor */}
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