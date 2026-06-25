<script setup lang="ts">
import { h, ref, onMounted } from 'vue'
import {
  NButton, NDataTable, NUpload, NUploadDragger,
  NText, NSpin, NAlert, NTag, useMessage, NSpace,
} from 'naive-ui'
import type { UploadFileInfo } from 'naive-ui'
import { employeesApi } from '@/api/employees'

const message = useMessage()
const employees = ref<any[]>([])
const loading = ref(false)
const importing = ref(false)

const columns = [
  { title: 'ФИО', key: 'fullName', sorter: 'default' },
  { title: 'Логин (Jira)', key: 'jiraIdentity', render: (r: any) => r.jiraIdentity ?? '—' },
  { title: 'Email', key: 'mail', render: (r: any) => r.mail ?? '—' },
  {
    title: 'Направление', key: 'direction',
    render: (r: any) => h(NTag, { size: 'small', type: 'info', bordered: false }, { default: () => r.direction ?? '—' }),
  },
  {
    title: 'Роль', key: 'role',
    render: (r: any) => h(NTag, { size: 'small', type: 'success', bordered: false }, { default: () => r.role ?? '—' }),
  },
  {
    title: 'Статус', key: 'active', width: 110,
    render: (r: any) => h(NTag, { size: 'small', type: r.active ? 'success' : 'default', bordered: false }, {
      default: () => r.active ? 'Активен' : 'Неактивен',
    }),
  },
  {
    title: 'Проверка', key: 'needsReview', width: 110,
    render: (r: any) => r.needsReview
      ? h(NTag, { size: 'small', type: 'warning', bordered: false }, { default: () => '⚠ Проверить' })
      : null,
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

async function handleImport({ file }: { file: UploadFileInfo }) {
  if (!file.file) return
  importing.value = true
  try {
    const { data } = await employeesApi.import(file.file)
    message.success(`Импортировано: ${data.created} новых, обновлено: ${data.updated}`)
    if (data.warnings?.length) {
      data.warnings.forEach((w: string) => message.warning(w))
    }
    await load()
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка импорта')
  } finally {
    importing.value = false
  }
}

onMounted(load)
</script>

<template>
  <div style="height: 100vh; display: flex; flex-direction: column; overflow: hidden;">

    <!-- Header -->
    <div style="padding: 20px 28px 16px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 18px; font-weight: 600; color: #e2e8f0;">Справочник сотрудников</div>
          <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
            Импорт из ADUsers.xlsx · Матчинг исполнителей Jira
            <span v-if="employees.length" style="margin-left: 8px; color: #94a3b8;">
              {{ employees.length }} записей
            </span>
          </div>
        </div>

        <!-- Upload button -->
        <NUpload
          accept=".xlsx,.xls,.csv"
          :max="1"
          :show-file-list="false"
          :custom-request="({ file }) => handleImport({ file })"
        >
          <NButton type="primary" :loading="importing" size="medium">
            📂 Импорт ADUsers.xlsx
          </NButton>
        </NUpload>
      </div>
    </div>

    <!-- Drop zone (when empty) -->
    <div v-if="!loading && employees.length === 0" style="padding: 28px; flex-shrink: 0;">
      <NUpload
        accept=".xlsx,.xls,.csv"
        :max="1"
        :show-file-list="false"
        :custom-request="({ file }) => handleImport({ file })"
      >
        <NUploadDragger style="border-radius: 10px;">
          <div style="padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <span style="font-size: 40px;">📂</span>
            <NText style="font-size: 15px; color: #cbd5e1; font-weight: 500;">
              Перетащите ADUsers.xlsx сюда
            </NText>
            <NText depth="3" style="font-size: 12px;">
              Поддерживаются .xlsx, .xls, .csv
            </NText>
          </div>
        </NUploadDragger>
      </NUpload>
    </div>

    <!-- Table -->
    <div style="flex: 1; overflow: hidden; padding: 0 28px 28px;">
      <NSpin :show="loading" style="height: 100%;">
        <NDataTable
          v-if="employees.length > 0"
          :columns="columns"
          :data="employees"
          :pagination="{ pageSize: 25 }"
          :max-height="'calc(100vh - 140px)'"
          size="small"
          striped
          virtual-scroll
        />
      </NSpin>
    </div>

  </div>
</template>
