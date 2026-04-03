
'use client'

import { useRef, useState } from "react"

interface Props {
  onTranscript: (text: string) => void
}

export default function AudioUpload({ onTranscript }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<"idle" | "uploading" | "transcribing" | "done" | "error">("idle")
  const [filename, setFilename] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  const isUploading = status === "uploading" || status === "transcribing"

  async function handleFile(file: File) {
    setFilename(file.name)
    setErrorMessage("")
    setStatus("uploading")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", `Uploaded file - ${file.name}`)

      setStatus("transcribing")

      const response = await fetch(`${apiUrl}/api/transcribe`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || payload.detail || "Transcription failed")
      }

      const { transcript } = await response.json()
      setStatus("done")
      onTranscript(transcript)
    } catch (error) {
      console.error(error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Upload failed")
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]

    if (file) {
      void handleFile(file)
    }
  }

  const label = {
    idle: "Drop an audio or video file, or click to browse",
    uploading: `Uploading ${filename}…`,
    transcribing: `Transcribing ${filename}…`,
    done: `Done — transcript loaded from ${filename}`,
    error: "Upload failed — check the message below",
  }[status]

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => !isUploading && status !== "transcribing" && inputRef.current?.click()}
      style={{
        border: "1.5px dashed var(--border)",
        borderRadius: "var(--border-radius-lg)",
        padding: "24px",
        textAlign: "center",
        cursor: !isUploading && status !== "transcribing" ? "pointer" : "default",
        color: "var(--muted-foreground)",
        fontSize: "14px",
        transition: "border-color .15s",
      }}
    >
      {(status === "uploading" || status === "transcribing") && (
        <span style={{ display: "inline-block", marginRight: 8 }}>⏳</span>
      )}
      {label}
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])}
      />
      {status === "idle" && (
        <div style={{ marginTop: 6, fontSize: "12px", color: "var(--muted-foreground)" }}>
          .mp3 .mp4 .m4a .wav .webm — local upload + local Whisper transcription
        </div>
      )}
      {status === "error" && errorMessage && (
        <div style={{ marginTop: 8, fontSize: "12px", color: "var(--destructive)" }}>
          {errorMessage}
        </div>
      )}
    </div>
  )
}