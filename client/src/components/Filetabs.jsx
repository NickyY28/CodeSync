import "./FileTabs.css";

// Map file extensions to language labels shown in the tab
const LANG_COLORS = {
  javascript: "#f7df1e",
  typescript: "#3178c6",
  python: "#3572A5",
  css: "#563d7c",
  html: "#e34c26",
};

export default function FileTabs({ files, activeFile, onSwitch }) {
  return (
    <div className="filetabs">
      {files.map((file) => (
        <button
          key={file._id}
          className={`filetab ${activeFile?._id === file._id ? "active" : ""}`}
          onClick={() => onSwitch(file)}
        >
          {/* colored dot = language indicator */}
          <span
            className="filetab__dot"
            style={{ background: LANG_COLORS[file.language] || "#888" }}
          />
          {file.name}
        </button>
      ))}
    </div>
  );
}