import { useState } from "react";
import axios from "axios";
import "./OutputPanel.css";

export default function OutputPanel({ getCode, language }) {
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    const code = getCode?.() || "";
    if (!code.trim()) return;
    setRunning(true);
    setOutput(null);
    setError("");

    try {
      const { data } = await axios.post("/api/execute", { code, language });
      setOutput(data);
    } catch (err) {
      setError(err.response?.data?.message || "Execution failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="output-panel">
      <div className="output-panel__header">
        <span className="output-panel__label">output</span>
        <div className="output-panel__meta">
          {output && (
            <>
              <span className={`output-status ${output.stderr ? "error" : "ok"}`}>
                {output.status}
              </span>
              {output.time && (
                <span className="output-stat">{output.time}s</span>
              )}
              {output.memory && (
                <span className="output-stat">{output.memory}kb</span>
              )}
            </>
          )}
        </div>
        <button
          className={`btn btn-primary run-btn ${running ? "running" : ""}`}
          onClick={run}
          disabled={running}
        >
          {running ? (
            <><span className="run-spinner" /> running...</>
          ) : (
            "▶ run"
          )}
        </button>
      </div>

      <div className="output-body">
        {!output && !error && !running && (
          <p className="output-empty">press run to execute code</p>
        )}
        {running && (
          <p className="output-empty">executing...</p>
        )}
        {error && (
          <pre className="output-error">{error}</pre>
        )}
        {output?.stderr && (
          <pre className="output-error">{output.stderr}</pre>
        )}
        {output?.stdout && (
          <pre className="output-stdout">{output.stdout}</pre>
        )}
        {output && !output.stdout && !output.stderr && (
          <p className="output-empty">no output</p>
        )}
      </div>
    </div>
  );
}