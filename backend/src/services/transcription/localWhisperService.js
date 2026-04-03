import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const whisperScriptPath = path.join(__dirname, "localWhisper.py");

const buildPythonCandidates = () => {
  if (process.env.PYTHON_CMD) {
    return [{ command: process.env.PYTHON_CMD, prefixArgs: [] }];
  }

  if (process.platform === "win32") {
    return [
      { command: "py", prefixArgs: ["-3"] },
      { command: "python", prefixArgs: [] },
      { command: "python3", prefixArgs: [] },
    ];
  }

  return [
    { command: "python3", prefixArgs: [] },
    { command: "python", prefixArgs: [] },
  ];
};

const runWhisperScript = ({ command, prefixArgs, filePath, model, chunkSeconds }) =>
  new Promise((resolve, reject) => {
    const normalizedChunkSeconds = Number.isFinite(chunkSeconds) ? Math.max(0, Math.floor(chunkSeconds)) : 0;

    const args = [
      ...prefixArgs,
      whisperScriptPath,
      "--file",
      filePath,
      "--model",
      model,
      "--chunk-seconds",
      String(normalizedChunkSeconds),
    ];

    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `${command} exited with code ${code}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (parseError) {
        reject(new Error(`Invalid Whisper output: ${stdout.slice(0, 300)}`));
      }
    });
  });

export const transcribeWithLocalWhisper = async ({ filePath, model = "base", chunkSeconds = 600 }) => {
  const candidates = buildPythonCandidates();
  let lastError = null;

  for (const candidate of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await runWhisperScript({
        command: candidate.command,
        prefixArgs: candidate.prefixArgs,
        filePath,
        model,
        chunkSeconds,
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const missingBinary = /ENOENT|not recognized|No such file or directory/i.test(message);

      if (!missingBinary) {
        throw error;
      }

      lastError = error;
    }
  }

  throw new Error(
    `Python is required for local Whisper transcription. Install Python 3 and pip install -r backend/requirements-whisper.txt. ${
      lastError instanceof Error ? `Last error: ${lastError.message}` : ""
    }`.trim(),
  );
};
