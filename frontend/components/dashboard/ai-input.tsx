"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface AIInputProps {
  onExtract: (transcript: string) => void | Promise<void>
  isLoading: boolean
  initialTranscript?: string
}

export function AIInput({ onExtract, isLoading, initialTranscript }: AIInputProps) {
  const [transcript, setTranscript] = useState("")

  useEffect(() => {
    if (typeof initialTranscript === "string") {
      setTranscript(initialTranscript)
    }
  }, [initialTranscript])
  
  const handleSubmit = () => {
    if (transcript.trim()) {
      onExtract(transcript)
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
        <Textarea
          placeholder={placeholder}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="min-h-[180px] bg-secondary/50 border-border/70 resize-none"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!transcript.trim() || isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-primary-foreground"
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
          <Button
            type="button"
            variant="outline"
            disabled={!transcript.trim() || isLoading}
            onClick={() => setTranscript("")}
          >
            Clear transcript
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
