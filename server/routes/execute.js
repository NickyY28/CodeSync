const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

// language name → Judge0 language ID
// full list at: https://ce.judge0.com/languages
const LANGUAGE_IDS = {
  javascript: 63,   // Node.js 12
  python: 71,       // Python 3
  cpp: 54,          // C++ 17
  c: 50,            // C
  java: 62,         // Java
  typescript: 74,   // TypeScript
  go: 60,           // Go
  rust: 73,         // Rust
};

router.post("/", protect, async (req, res) => {
  const { code, language } = req.body;

  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    return res.status(400).json({ message: `Language "${language}" not supported for execution` });
  }

  try {
    // Step 1 — Submit code to Judge0 (returns a token)
    const submitRes = await fetch(`${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=false`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: "",           // no stdin input for now
      }),
    });

    const { token } = await submitRes.json();
    if (!token) return res.status(500).json({ message: "Submission failed" });

    // Step 2 — Poll until execution finishes
    // Judge0 is async — status 1 = queued, 2 = processing, 3+ = done
    let result;
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1000)); // wait 1s between polls

      const pollRes = await fetch(
        `${process.env.JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
        {
          headers: {
            "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );
      result = await pollRes.json();

      // Status ID 3 = accepted, 4+ = error states — all mean execution is done
      if (result.status?.id >= 3) break;
    }

    res.json({
      stdout: result.stdout || "",
      stderr: result.stderr || result.compile_output || "",
      status: result.status?.description || "Unknown",
      time: result.time,       // execution time in seconds
      memory: result.memory,   // memory used in KB
    });

  } catch (err) {
    res.status(500).json({ message: "Execution failed", error: err.message });
  }
});

module.exports = router;