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
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  onDeleteTask: (id: string) => void
  onSaveAll: () => void
}

export function ExtractedTasks({ tasks, onUpdateTask, onDeleteTask, onSaveAll }: ExtractedTasksProps) {
  if (tasks.length === 0) return null

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
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50"
          >
            {/* Task title and checkbox */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Checkbox
                checked={task.completed}
                onCheckedChange={(checked) => 
                  onUpdateTask(task.id, { completed: checked as boolean })
                }
                className="mt-0.5 border-muted-foreground/70 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white"
              />
              <span className={cn(
                "text-sm leading-relaxed",
                task.completed && "line-through text-muted-foreground"
              )}>
                {task.title}
              </span>
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              {/* Assignee dropdown */}
              <Select
                value={task.assignee}
                onValueChange={(value) => onUpdateTask(task.id, { assignee: value })}
              >
                <SelectTrigger className="w-[140px] h-9 text-xs bg-secondary/50">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Priority badge/dropdown */}
              <Select
                value={task.priority}
                onValueChange={(value) => onUpdateTask(task.id, { priority: value as Task["priority"] })}
              >
                <SelectTrigger className="w-[100px] h-9 text-xs bg-secondary/50">
                  <Badge 
                    variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {task.priority}
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      <Badge 
                        variant={priority === "High" ? "destructive" : priority === "Medium" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {priority}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Deadline date picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-[130px] justify-start text-xs bg-secondary/50 hover:bg-secondary">
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {task.deadline ? format(new Date(task.deadline), "MMM d, yyyy") : "Set date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
              
              {/* Delete button */}
              <Button 
                variant="ghost" 
                size="sm"
                className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => onDeleteTask(task.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
