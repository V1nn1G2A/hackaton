<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NButton, NDataTable, NUpload, NUploadDragger, NText, NIcon,
  NSpace, NSpin, NAlert, NTag, useMessage,
} from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'
import { employeesApi } from '@/api/employees'

const message = useMessage()

const employees = ref<any[]>([])
const loading = ref(false)
const importing = ref(false)

const columns = [
  { title: 'ФИО', key: 'fullName' },
  { title: 'Логин (Jira)', key: 'jiraIdentity' },
  { title: 'Email', key: 'email' },
  {
    title: 'Направление', key: 'direction',
    render: (row: any) => h(NTag, { size: 'small', type: 'info' }, { default: () => row.direction ?? '—' }),
  },
  {
    title: 'Роль', key: 'role',
    render: (row: any) => h(NTag, { size: 'small', type: 'success' }, { default: () => row.role ?? '—' }),
  },
  {
    title: 'Статус', key: 'active',
    render: (row: any) => h(NTag, { size: 'small', type: row.active ? 'success' : 'default' }, {
      default: () => row.active ? 'Активен' : 'Неактивен',
    }),
  },
]

async function load() {
  loading.value = true
  try {
    const { data } = await employeesApi.getAll()
    employees.value = data
  } catch {
    message.error('Не удалось загрузить справочник')
  } finally {
    loading.value = false
  }
}

async function handleImport(options: { file: UploadFileInfo }) {
  if (!options.file.file) return
  importing.value = true
  try {
    const { data } = await employeesApi.import(options.file.file)
    message.success(`Импортировано: ${data.created ?? 0} новых, обновлено: ${data.updated ?? 0}`)
    await load()
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка импорта')
  } finally {
    importing.value = false
  }
}

import { h } from 'vue'
onMounted(load)
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold text-slate-100">Справочник сотрудников</h1>
        <p class="text-sm text-slate-500 mt-0.5">Импорт из ADUsers.xlsx — матчинг исполнителей Jira</p>
      </div>
    </div>

    <!-- Upload -->
    <NUpload
      accept=".xlsx,.xls,.csv"
      :max="1"
      :show-file-list="false"
      :custom-request="({ file }) => handleImport({ file })"
      class="mb-6"
    >
      <NUploadDragger>
        <div class="py-6 flex flex-col items-center gap-2">
          <NIcon size="32" style="color: #4f7cff">
            <span style="font-size: 32px">📂</span>
          </NIcon>
          <NText class="text-slate-300 font-medium">
            Перетащите ADUsers.xlsx или нажмите для выбора
          </NText>
          <NText depth="3" style="font-size: 12px">
            Поддерживаются .xlsx, .xls, .csv
          </NText>
          <NButton
            v-if="importing"
            :loading="true"
            type="primary"
            size="small"
            style="margin-top: 8px"
          >
            Импортируется...
          </NButton>
        </div>
      </NUploadDragger>
    </NUpload>

    <!-- Table -->
    <NSpin :show="loading">
      <NAlert v-if="!loading && employees.length === 0" type="info" style="margin-bottom: 16px">
        Справочник пуст. Загрузите файл ADUsers.xlsx для импорта сотрудников.
      </NAlert>
      <NDataTable
        v-if="employees.length > 0"
        :columns="columns"
        :data="employees"
        :pagination="{ pageSize: 20 }"
        size="small"
        striped
      />
    </NSpin>
  </div>
</template>
