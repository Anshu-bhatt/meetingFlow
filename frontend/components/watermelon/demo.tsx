"use client"

import { DashboardLayout } from "@/components/watermelon/dashboard-layout"
import TasksPageView from "@/components/watermelon/task-page-view"

export default function TaskManagementDashboardDemo() {
  return (
    <DashboardLayout>
      <TasksPageView />
    </DashboardLayout>
  )
}
