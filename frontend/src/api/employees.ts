import { apiClient } from './client'

export const employeesApi = {
  getAll: () => apiClient.get('/employees'),

  update: (id: string, data: { direction?: string; role?: string; active?: boolean }) =>
    apiClient.patch(`/employees/${id}`, data),

  import: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post('/employees/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
