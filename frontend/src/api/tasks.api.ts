import { apiClient } from './client'
import type { Task, TaskStatus } from '@/types'

export const tasksApi = {
  list: (sprintId: string) => apiClient.get<Task[]>(`/sprints/${sprintId}/tasks`),
  update: (id: string, data: Partial<Task>) => apiClient.patch<Task>(`/tasks/${id}`, data),
  updateStatus: (id: string, status: TaskStatus) => apiClient.patch<Task>(`/tasks/${id}`, { status }),
  importExcel: (sprintId: string, structureFile: File, worklogFile: File, parentTaskKey: string) => {
    const form = new FormData()
    form.append('structureFile', structureFile)
    form.append('worklogFile', worklogFile)
    form.append('deliveryKey', parentTaskKey)
    return apiClient.post(`/sprints/${sprintId}/tasks/import`, form)
  },
}
