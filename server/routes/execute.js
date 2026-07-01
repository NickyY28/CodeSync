const express = require("express");
const vm = require("vm");
const { spawn } = require("child_process");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const SUPPORTED = new Set(["javascript", "python"]);

const runJavaScript = (code) => {
  const logs = [];
  const sandbox = {
    console: {
      log: (...args) => logs.push(args.map(String).join(" ")),
      error: (...args) => logs.push(args.map(String).join(" ")),
      warn: (...args) => logs.push(args.map(String).join(" ")),
    },
  };

  try {
    vm.runInNewContext(code, sandbox, { timeout: 5000 });
    return { stdout: logs.join("\n"), stderr: "", status: "Accepted" };
  } catch (err) {
    return {
      stdout: logs.join("\n"),
      stderr: err.message,
      status: "Runtime Error",
    };
  }
};

const runPython = (code) =>
  new Promise((resolve) => {
    const py = process.platform === "win32" ? "python" : "python3";
    const proc = spawn(py, ["-c", code], { timeout: 5000 });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => { stdout += chunk; });
    proc.stderr.on("data", (chunk) => { stderr += chunk; });
    proc.on("error", (err) => {
      resolve({
        stdout: "",
        stderr: err.code === "ENOENT"
          ? "Python is not installed on the server"
          : err.message,
        status: "Runtime Error",
      });
    });
    proc.on("close", (exitCode) => {
      resolve({
        stdout,
        stderr,
        status: exitCode === 0 ? "Accepted" : "Runtime Error",
      });
    });
  });

router.post("/", protect, async (req, res) => {
  const { code, language } = req.body;

  if (!SUPPORTED.has(language)) {
    return res.status(400).json({
      message: `Language "${language}" is not supported for execution yet. Try JavaScript or Python.`,
    });
  }

  try {
    const result =
      language === "javascript" ? runJavaScript(code) : await runPython(code);

    res.json({
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      status: result.status,
      time: null,
      memory: null,
    });
  } catch (err) {
    res.status(500).json({ message: "Execution failed", error: err.message });
  }
});

module.exports = router;
