"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ListTodo, MoreHorizontal, Trash2, Edit } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"

interface TaskTableProps {
  tasks: Task[]
  onToggleComplete: (id: string) => void
  onDeleteTask: (id: string) => void
}

export function TaskTable({ tasks, onToggleComplete, onDeleteTask }: TaskTableProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ListTodo className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>All Tasks</CardTitle>
            <CardDescription>Manage and track all your meeting tasks</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
              <ListTodo className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No tasks yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Paste a meeting transcript above to extract tasks automatically
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} className="hover:bg-secondary/20">
                    <TableCell>
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => onToggleComplete(task.id)}
                        className="border-muted-foreground/70 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white"
                      />
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-medium",
                        task.completed && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                          {task.assignee.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-sm">{task.assignee}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={task.completed ? "secondary" : task.priority === "High" ? "destructive" : "default"}
                      >
                        {task.completed ? "Completed" : task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {task.deadline ? format(new Date(task.deadline), "MMM d, yyyy") : "No deadline"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDeleteTask(task.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
