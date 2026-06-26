import { apiClient } from './client'

export const veiApi = {
  analyze(structureFile: File, worklogFile: File, deliveryKey: string) {
    const fd = new FormData()
    fd.append('structureFile', structureFile)
    fd.append('worklogFile', worklogFile)
    fd.append('deliveryKey', deliveryKey)
    return apiClient.post('/vei/analyze', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
