"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, X } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface AIInputProps {
  onExtract: (transcript: string) => void | Promise<void>
  isLoading: boolean
  initialTranscript?: string
}

export function AIInput({ onExtract, isLoading, initialTranscript }: AIInputProps) {
  const [transcript, setTranscript] = useState("")

  // Only set initial transcript once on mount, don't keep syncing
  useEffect(() => {
    if (initialTranscript && transcript === "") {
      setTranscript(initialTranscript)
    }
  }, [])

  const handleClear = () => {
    console.log("[AIInput] Clearing transcript")
    setTranscript("")
  }

  const handleSubmit = () => {
    console.log("[AIInput] handleSubmit called")
    console.log("[AIInput] transcript length:", transcript.length)
    console.log("[AIInput] transcript.trim():", transcript.trim().length > 0)
    console.log("[AIInput] full transcript:", transcript)

    if (transcript.trim()) {
      console.log("[AIInput] Calling onExtract with transcript:", transcript.substring(0, 50))
      onExtract(transcript)
    } else {
      console.log("[AIInput] Transcript is empty!")
    }
  }

  const placeholder = `Paste your meeting transcript here...

Example:
"John mentioned we need to review the Q4 budget by Friday. Sarah will schedule a follow-up call with the client next week. Mike should update the project timeline before the next sprint planning."`

  return (
    <Card className="wm-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/35 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>AI Task Extraction</CardTitle>
            <CardDescription>Paste transcript or use upload below to extract tasks</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea
            placeholder={placeholder}
            value={transcript}
            onChange={(e) => {
              console.log("[AIInput] onChange fired, new value length:", e.target.value.length)
              setTranscript(e.target.value)
            }}
            disabled={isLoading}
            className="min-h-[180px] bg-secondary/50 border-border/70 resize-none"
          />
          {transcript && (
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="absolute top-2 right-2 p-2 hover:bg-destructive/20 rounded-md text-muted-foreground hover:text-destructive transition-colors"
              title="Clear transcript"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!transcript.trim() || isLoading}
            className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-accent text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Extracting Tasks...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Extract Tasks
              </>
            )}
          </Button>
          {transcript && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {transcript.length} character{transcript.length !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  )
}
