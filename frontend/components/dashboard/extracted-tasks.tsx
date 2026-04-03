"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, CheckCircle2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"
import { teamMembers, priorities } from "@/lib/types"

interface ExtractedTasksProps {
  tasks: Task[]
  meetingSummary?: string | null
  totalTasks?: number | null
  highPriorityCount?: number | null
  speakersDetected?: string[]
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  onDeleteTask: (id: string) => void
  onSaveAll: () => void
}

export function ExtractedTasks({
  tasks,
  meetingSummary,
  totalTasks,
  highPriorityCount,
  speakersDetected = [],
  onUpdateTask,
  onDeleteTask,
  onSaveAll,
}: ExtractedTasksProps) {
  if (tasks.length === 0 && !meetingSummary) return null

  // Get list of assignees to show in dropdown (speakers from transcript or all team members)
  const getAvailableAssignees = (currentAssignee: string) => {
    const speakers = speakersDetected.length > 0 ? speakersDetected : teamMembers
    // Put current assignee first if they're in the list and not "Unassigned"
    const filtered = speakers.filter(name => name !== "Unassigned")
    if (currentAssignee && currentAssignee !== "Unassigned" && !filtered.includes(currentAssignee)) {
      return [currentAssignee, ...filtered]
    }
    return filtered
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle>Extracted Tasks</CardTitle>
              <CardDescription>{tasks.length} tasks found from transcript</CardDescription>
            </div>
          </div>
          <Button onClick={onSaveAll}>
            Save All Tasks
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {meetingSummary ? (
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <span>{totalTasks ?? tasks.length} total tasks</span>
              <span>•</span>
              <span>{highPriorityCount ?? tasks.filter((task) => task.priority === "High").length} high priority</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
              {meetingSummary}
            </p>
          </div>
        ) : null}

        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-4 text-sm text-muted-foreground">
            No action items were extracted from this transcript.
          </div>
        ) : null}

        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
          >
            {/* Checkbox */}
            <Checkbox
              checked={task.completed}
              onCheckedChange={(checked) =>
                onUpdateTask(task.id, { completed: checked as boolean })
              }
              className="flex-shrink-0 border-muted-foreground/70 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white"
            />

            {/* Task title */}
            <span className={cn(
              "text-sm flex-1 min-w-0",
              task.completed && "line-through text-muted-foreground"
            )}>
              {task.title}
            </span>

            {/* Assignee - Editable Select */}
            <Select
              value={task.assignee}
              onValueChange={(value) => onUpdateTask(task.id, { assignee: value })}
            >
              <SelectTrigger className="flex-shrink-0 h-7 px-2 text-xs bg-blue-500/15 border border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-500/25 rounded-md">
                <SelectValue placeholder="👤 Assign" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableAssignees(task.assignee).map((member) => (
                  <SelectItem key={member} value={member}>
                    👤 {member}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority */}
            <Select
              value={task.priority}
              onValueChange={(value) => onUpdateTask(task.id, { priority: value as Task["priority"] })}
            >
              <SelectTrigger className="flex-shrink-0 h-7 w-auto px-2 text-xs bg-secondary/50 border-border/50 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Deadline */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 h-7 px-2 text-xs bg-secondary/50 hover:bg-secondary border-border/50 rounded-md"
                >
                  <CalendarIcon className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={task.deadline ? new Date(task.deadline) : undefined}
                  onSelect={(date) =>
                    onUpdateTask(task.id, { deadline: date?.toISOString() ?? null })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Delete */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-md"
              onClick={() => onDeleteTask(task.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
