import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { saveTranscriptMeeting } from "../services/meetingService.js";
import { transcribeWithLocalWhisper } from "../services/transcription/localWhisperService.js";

const router = express.Router();

const uploadDir = path.join(os.tmpdir(), "meetflow-uploads");
fs.mkdirSync(uploadDir, { recursive: true });

export const uploadTranscribeFile = multer({
  dest: uploadDir,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMime = new Set([
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/m4a",
      "audio/x-m4a",
      "audio/aac",
      "audio/ogg",
      "audio/oga",
      "audio/wav",
      "audio/x-wav",
      "audio/webm",
      "audio/flac",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-matroska",
    ]);

    const allowedExtensions = new Set([
      ".mp3",
      ".mp4",
      ".m4a",
      ".wav",
      ".webm",
      ".mov",
      ".aac",
      ".ogg",
      ".oga",
      ".flac",
      ".mkv",
    ]);

    const ext = path.extname(file.originalname || "").toLowerCase();
    const isAudioOrVideoMime = Boolean(file.mimetype) && (file.mimetype.startsWith("audio/") || file.mimetype.startsWith("video/"));
    const hasGenericBinaryMime = file.mimetype === "application/octet-stream" || file.mimetype === "binary/octet-stream";
    const acceptedByMime = allowedMime.has(file.mimetype) || isAudioOrVideoMime || hasGenericBinaryMime;

    if (!acceptedByMime && !allowedExtensions.has(ext)) {
      return cb(new Error("Unsupported file type. Upload an audio or video file."));
    }

    return cb(null, true);
  },
});

const transcribeFileAtPath = async ({ filePath, originalName, title, userId }) => {
  const configuredChunkSeconds = Number(process.env.WHISPER_CHUNK_SECONDS || 600);
  const whisperResult = await transcribeWithLocalWhisper({
    filePath,
    model: process.env.WHISPER_MODEL || "base",
    chunkSeconds: Number.isFinite(configuredChunkSeconds) ? configuredChunkSeconds : 600,
  });

  const transcriptText = whisperResult.text;

  let meetingResult = { meetingId: null, persisted: false };

  try {
    meetingResult = await saveTranscriptMeeting({
      userId,
      title: title || originalName,
      transcript: transcriptText,
    });
  } catch (persistError) {
    console.error("Transcript persistence warning:", persistError);
  }

  return {
    transcript: transcriptText,
    segments: whisperResult.segments,
    language: whisperResult.language,
    duration: whisperResult.duration,
    chunksProcessed: whisperResult.chunksProcessed,
    provider: whisperResult.provider || "local-whisper",
    meetingId: meetingResult.meetingId,
    persisted: meetingResult.persisted,
  };
};

export const handleTranscribeUpload = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio/video file provided" });
  }

  const ext = path.extname(req.file.originalname) || ".mp4";
  const filePath = `${req.file.path}${ext}`;

  try {
    fs.renameSync(req.file.path, filePath);

    const result = await transcribeFileAtPath({
      filePath,
      originalName: req.file.originalname,
      title: req.body?.title,
      userId: req.auth?.userId,
    });

    return res.json(result);
  } catch (error) {
    console.error("Whisper transcription route error:", error);
    return res.status(500).json({
      error: "Transcription failed",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }
  }
};

export const handleTranscribeUploadThing = async (req, res) => {
  const { fileUrl, fileName, mimeType, title } = req.body || {};

  if (!fileUrl || !fileName) {
    return res.status(400).json({ error: "fileUrl and fileName are required" });
  }

  const tempExt = path.extname(fileName) || (mimeType?.includes("video") ? ".mp4" : ".m4a");
  const downloadPath = path.join(uploadDir, `${Date.now()}-${Math.random().toString(16).slice(2)}${tempExt}`);

  try {
    const response = await fetch(fileUrl);

    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch uploaded file: ${response.status} ${response.statusText}`);
    }

    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(downloadPath));

    const result = await transcribeFileAtPath({
      filePath: downloadPath,
      originalName: fileName,
      title,
      userId: req.auth?.userId,
    });

    return res.json(result);
  } catch (error) {
    console.error("UploadThing transcription route error:", error);
    return res.status(500).json({
      error: "Transcription failed",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  } finally {
    if (fs.existsSync(downloadPath)) {
      fs.unlink(downloadPath, () => {});
    }
  }
};

router.post("/", requireAuth, (req, res, next) => {
  uploadTranscribeFile.single("file")(req, res, (err) => {
    if (!err) {
      return next();
    }

    const message = err.message || "Upload failed";
    const statusCode = /File too large/i.test(message) ? 413 : 400;
    return res.status(statusCode).json({ error: message });
  });
}, handleTranscribeUpload);
router.post("/uploadthing", requireAuth, express.json(), handleTranscribeUploadThing);

export default router;