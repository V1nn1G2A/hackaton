import { apiClient } from './client'

export const employeesApi = {
  getAll: () => apiClient.get('/employees'),

  import: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.post('/employees/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
