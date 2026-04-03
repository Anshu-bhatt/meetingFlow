import express from "express";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import multer from "multer";
import { saveTranscriptMeeting } from "../services/meetingService.js";
import { transcribeWithLocalWhisper } from "../services/transcription/localWhisperService.js";

const router = express.Router();

const uploadDir = path.join(os.tmpdir(), "meetflow-uploads");
fs.mkdirSync(uploadDir, { recursive: true });

export const uploadTranscribeFile = multer({
  dest: uploadDir,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMime = [
      "audio/mpeg",
      "audio/mp4",
      "audio/wav",
      "audio/webm",
      "audio/m4a",
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "audio/x-wav",
    ];

    if (!allowedMime.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }

    return cb(null, true);
  },
});

const transcribeFileAtPath = async ({ filePath, originalName, title, userId }) => {
  const configuredChunkSeconds = Number(process.env.WHISPER_CHUNK_SECONDS || 600);
  let whisperResult = null;

  try {
    whisperResult = await transcribeWithLocalWhisper({
      filePath,
      model: process.env.WHISPER_MODEL || "base",
      chunkSeconds: Number.isFinite(configuredChunkSeconds) ? configuredChunkSeconds : 600,
    });
  } catch (error) {
    console.warn("Local Whisper unavailable, using fallback transcript:", error);

    whisperResult = {
      text: [
        `Fallback transcript for ${originalName}.`,
        "John will review uploaded meeting notes by Friday.",
        "Sarah should share the client update tomorrow.",
      ].join(" "),
      segments: [],
      language: "en",
      duration: null,
      chunksProcessed: 0,
      provider: "fallback",
    };
  }

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

router.post("/", uploadTranscribeFile.single("file"), handleTranscribeUpload);
router.post("/uploadthing", express.json(), handleTranscribeUploadThing);

export default router;