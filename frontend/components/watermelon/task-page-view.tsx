"use client"

import type { ReactNode } from "react"
import {
  IconAdjustmentsHorizontal,
  IconAlertTriangleFilled,
  IconBell,
  IconBrandVscode,
  IconCalendarEvent,
  IconCheck,
  IconCircle,
  IconCircleCheckFilled,
  IconCircleDashed,
  IconCirclePlus,
  IconClipboardCheck,
  IconDots,
  IconFlag,
  IconFlagFilled,
  IconFolder,
  IconGitBranch,
  IconHash,
  IconLayoutGrid,
  IconLayoutSidebar,
  IconList,
  IconLock,
  IconPlus,
  IconQuestionMark,
  IconSearch,
  IconSortAscending,
  IconSun,
  IconTable,
  IconTimeline,
  IconUpload,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { amsGroups, type Group, type Task, visualizeGroups } from "@/components/watermelon/data"

function FilterPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 h-6 px-2 rounded-full border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 font-medium whitespace-nowrap">
      {icon}
      {label}
    </div>
  )
}

function TaskItem({ task }: { task: Task }) {
  const statusIcons = {
    todo: <IconCircleDashed className="size-5 text-neutral-400" />,
    doing: <IconSun className="size-5 text-orange-600 fill-orange-600" />,
    done: <IconCircleCheckFilled className="size-5 text-emerald-600" />,
  }

  const priorityIcons = {
    low: <IconFlagFilled className="size-[18px] text-neutral-300" />,
    normal: <IconFlagFilled className="size-[18px] text-blue-500 fill-blue-500" />,
    high: <IconFlagFilled className="size-[18px] text-orange-500 fill-orange-500" />,
    urgent: <IconAlertTriangleFilled className="size-[18px] text-rose-500 fill-rose-500" />,
  }

  return (
    <div className="flex items-center gap-3 p-1.5 rounded-full bg-white dark:bg-neutral-800/20 border dark:border-neutral-700/40 hover:border-neutral-200 dark:hover:border-neutral-700 transition-all duration-200 cursor-pointer group">
      <div className="flex items-center gap-2.5 shrink-0 px-0.5">
        {statusIcons[task.status]}
        {priorityIcons[task.priority]}
      </div>

      <div className="flex-1 min-w-0 flex gap-3">
        <span className="text-[13px] tracking-tight font-semibold text-neutral-800 dark:text-neutral-200 truncate block">
          {task.title}
        </span>
        {task.subtasks && (
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500 font-medium tabular-nums">
            <IconGitBranch className="size-3 -rotate-45" />
            {task.subtasks}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="text-[9px] h-4.5 uppercase rounded-full border dark:border-neutral-800 text-neutral-500 bg-neutral-50/50 dark:bg-neutral-900 shadow-none max-md:hidden">
          # {task.category}
        </Badge>
        <span className="text-[12px] text-neutral-500 font-medium w-fit min-w-[44px] whitespace-nowrap shrink-0 text-right tabular-nums tracking-tight hidden sm:block">
          {task.date}
        </span>
        <div className={cn("size-5 rounded-full bg-linear-to-br ring-1 ring-white/10", task.avatarGradient)} />
      </div>
    </div>
  )
}

function ProjectCard({ title, logo, count, groups, isPrivate }: { title: string; logo: ReactNode; count: number; groups: Group[]; isPrivate?: boolean }) {
  return (
    <Card className="flex flex-col gap-0 bg-white dark:bg-neutral-900 shadow-none overflow-hidden rounded-lg p-0 border-neutral-200/80 dark:border-neutral-800/80">
      <CardHeader className="flex flex-row items-center justify-between px-4 py-3 border-b dark:border-neutral-800/50">
        <div className="flex items-center gap-2.5">
          {logo}
          <h3 className="font-semibold text-[15px] tracking-tight text-neutral-900 dark:text-neutral-100">{title}</h3>
          <div className="flex items-center gap-1.5 ml-1">
            <IconWorld className="size-3.5 text-neutral-500" />
            {isPrivate && <IconLock className="size-3.5 text-neutral-500" />}
            <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-1 text-[10px] h-4 leading-none font-medium ml-1 rounded">
              {count}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md">
              <IconDots className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Project Settings</DropdownMenuItem>
            <DropdownMenuItem>Manage Members</DropdownMenuItem>
            <DropdownMenuItem>Export Data</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-0 gap-0">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-200 dark:border-neutral-800/50 overflow-x-auto">
          <div className="size-6 rounded-full bg-neutral-500/10 flex items-center justify-center text-neutral-500 shrink-0">
            <IconCheck className="size-3.5" />
          </div>
          <Badge variant="secondary" className="bg-neutral-500/10 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-2.5 text-xs rounded-full flex items-center gap-1 h-6 shrink-0 border border-neutral-200 dark:border-neutral-700">
            <IconHash className="size-4" strokeWidth={2.5} /> Label
          </Badge>
          <FilterPill icon={<IconUsers className="size-3" />} label="Assignee" />
          <FilterPill icon={<IconCircle className="size-3.5" />} label="Status" />
          <FilterPill icon={<IconGitBranch className="size-3.5" />} label="Parent" />
          <FilterPill icon={<IconFlag className="size-3.5" />} label="Priority" />
        </div>

        <div className="flex flex-col dark:bg-neutral-900">
          {groups.map((group) => (
            <div key={group.id} className="px-4 pt-2 pb-4 border-b last:border-b-0">
              <div className="flex items-center gap-2 pt-1 pb-2">
                <IconHash className={cn("size-4 font-bold opacity-70", group.color)} />
                <span className="text-xs font-medium uppercase text-neutral-600 dark:text-neutral-400">{group.name}</span>
                <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-1 text-[10px] h-4 leading-none font-medium ml-1 rounded">
                  {group.count}
                </Badge>
              </div>
              <div className="flex flex-col gap-2.5">
                {group.tasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function TasksPageView() {
  return (
    <div className="flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950/50 rounded-xl overflow-hidden min-h-0 border border-neutral-200/70 dark:border-neutral-800/70">
      <header className="flex h-12 shrink-0 items-center justify-between px-4 border-b bg-background rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <IconClipboardCheck className="size-4.5 text-neutral-500" />
          <div className="flex items-center gap-1.5 text-[14px]">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">Tasks</span>
            <span className="text-neutral-400 font-light">/</span>
            <span className="text-neutral-500">Overview</span>
          </div>
          <IconLock className="size-3.5 text-neutral-400" />
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative group hidden md:block">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
            <Input placeholder="Search..." className="h-8 w-56 pl-8 pr-3 bg-white dark:bg-neutral-900 rounded-md text-xs border border-neutral-200 dark:border-neutral-800 shadow-none" />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="size-8 hidden sm:flex rounded-md">
                <IconBell className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="font-semibold text-sm">Notifications</span>
              </div>
              <div className="flex flex-col items-center justify-center py-8 text-sm text-neutral-500">No new notifications</div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="size-8 hidden sm:flex rounded-md">
                <IconQuestionMark className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Help Center</DropdownMenuItem>
              <DropdownMenuItem>Keyboard Shortcuts</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-8 px-3 gap-1.5 hidden md:flex rounded-md text-xs">
                <IconUpload className="size-3.5" />
                <span>Share</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Dashboard</DialogTitle>
                <DialogDescription>Anyone with the link can view this dashboard.</DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 mt-2">
                <Input value="https://meetflow.local/dashboard/tasks" readOnly />
                <Button className="shrink-0">Copy Link</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0 gap-0">
        <div className="flex h-12 shrink-0 items-stretch justify-between px-4 border-b bg-background overflow-x-auto">
          <div className="flex gap-4 shrink-0">
            <TabsList className="bg-transparent gap-3 h-12 p-0">
              {[
                { value: "overview", label: "Overview", icon: IconLayoutGrid },
                { value: "kanban", label: "Kanban", icon: IconLayoutSidebar },
                { value: "list", label: "List", icon: IconList },
                { value: "calendar", label: "Calendar", icon: IconCalendarEvent },
                { value: "table", label: "Table", icon: IconTable },
                { value: "folders", label: "Folders", icon: IconFolder },
                { value: "timeline", label: "Timeline", icon: IconTimeline },
              ].map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} disabled={tab.value !== "overview"} className="relative gap-1.5 px-1 py-0 bg-transparent rounded-none text-neutral-500 data-[state=active]:text-neutral-900 data-[state=active]:border-b-[1.5px] data-[state=active]:border-neutral-900 font-medium text-[13px] shrink-0 whitespace-nowrap">
                  <tab.icon className="size-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <Button variant="outline" className="h-8 gap-1 text-neutral-500 rounded-md text-[12px]">
              <IconPlus className="size-3" /> Add View
            </Button>
          </div>

          <div className="flex items-center gap-1.5 ml-4 shrink-0">
            <Button variant="outline" className="h-8 gap-2 px-3 rounded-md text-xs">
              <IconAdjustmentsHorizontal className="size-4" /> Filter (3)
            </Button>
            <Button variant="outline" className="h-8 gap-2 px-3 rounded-md text-xs">
              <IconSortAscending className="size-4" /> Sort
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-8 gap-2 px-3 rounded-md text-xs ml-1">
                  <IconCirclePlus className="size-4" /> Add Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>Add a new task to your project.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="task-name">Task Name</Label>
                    <Input id="task-name" placeholder="Enter task name..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea id="task-description" placeholder="Add more details..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="overview" className="flex-1 overflow-auto p-4 m-0 bg-neutral-50/50 dark:bg-neutral-950/50">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-[1600px] mx-auto">
            <ProjectCard
              title="AMS Project"
              logo={<div className="size-6 rounded bg-linear-to-br from-rose-500 via-orange-400 to-indigo-500" />}
              count={122}
              groups={amsGroups}
            />
            <ProjectCard
              title="Visualize.co"
              logo={<div className="size-6 rounded bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white"><IconBrandVscode className="size-4" /></div>}
              count={97}
              isPrivate
              groups={visualizeGroups}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
