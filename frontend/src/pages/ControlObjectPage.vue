<script setup lang="ts">
import { h, ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  NTabs, NTabPane, NButton, NDataTable, NUpload, NUploadDragger,
  NText, NSpin, NAlert, NTag, NSpace, NCard, NStatistic,
  NGrid, NGridItem, NInput, useMessage, NModal, NForm, NFormItem,
} from 'naive-ui'
import { controlObjectsApi } from '@/api/controlObjects'

const route = useRoute()
const message = useMessage()
const id = route.params.id as string

const obj = ref<any>(null)
const loading = ref(false)

// Baseline
const baseline = ref<any>(null)
const estimateTasks = ref<any[]>([])
const baselineLoading = ref(false)
const baselineImporting = ref(false)

// Jira
const epics = ref<any[]>([])
const tasks = ref<any[]>([])
const jiraLoading = ref(false)
const jiraImporting = ref(false)
const structureFile = ref<File | null>(null)
const worklogFile = ref<File | null>(null)
const deliveryKey = ref('')

// Analytics
const dashboard = ref<any>(null)
const risks = ref<any[]>([])
const dataQuality = ref<any[]>([])
const analyticsLoading = ref(false)

async function load() {
  loading.value = true
  try {
    const { data } = await controlObjectsApi.getById(id)
    obj.value = data
  } catch { message.error('Не удалось загрузить объект') }
  finally { loading.value = false }
}

async function loadBaseline() {
  baselineLoading.value = true
  try {
    const [b, et] = await Promise.all([
      controlObjectsApi.getBaseline(id),
      controlObjectsApi.getEstimateTasks(id),
    ])
    baseline.value = b.data
    estimateTasks.value = et.data
  } catch { /* baseline may not exist yet */ }
  finally { baselineLoading.value = false }
}

async function loadJira() {
  jiraLoading.value = true
  try {
    const [e, t] = await Promise.all([
      controlObjectsApi.getEpics(id),
      controlObjectsApi.getTasks(id),
    ])
    epics.value = e.data
    tasks.value = t.data
  } catch { }
  finally { jiraLoading.value = false }
}

async function loadAnalytics() {
  analyticsLoading.value = true
  try {
    const [d, r, dq] = await Promise.all([
      controlObjectsApi.getDashboard(id),
      controlObjectsApi.getRisks(id),
      controlObjectsApi.getDataQuality(id),
    ])
    dashboard.value = d.data
    risks.value = r.data
    dataQuality.value = dq.data
  } catch { }
  finally { analyticsLoading.value = false }
}

async function importBaseline({ file }: any) {
  if (!file.file) return
  baselineImporting.value = true
  try {
    const { data } = await controlObjectsApi.importBaseline(id, file.file)
    message.success(`Baseline загружен: ${data.estimateTasksCount ?? 0} задач`)
    await loadBaseline()
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка импорта baseline')
  } finally { baselineImporting.value = false }
}

async function importJira() {
  if (!structureFile.value || !worklogFile.value) {
    message.warning('Выберите оба файла: структуру и трудозатраты')
    return
  }
  jiraImporting.value = true
  try {
    await controlObjectsApi.importJira(id, structureFile.value, worklogFile.value, deliveryKey.value)
    message.success('Jira-выгрузка импортирована')
    await loadJira()
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка импорта Jira')
  } finally { jiraImporting.value = false }
}

async function autoLink() {
  try {
    const { data } = await controlObjectsApi.autoLink(id)
    message.success(`Авто-связка: ${data.linked ?? 0} эпиков`)
    await Promise.all([loadBaseline(), loadJira()])
  } catch (e: any) {
    message.error(e.response?.data?.message ?? 'Ошибка авто-связки')
  }
}

// Risk color
function riskType(status: string) {
  if (status === 'red') return 'error'
  if (status === 'yellow') return 'warning'
  if (status === 'green') return 'success'
  return 'default'
}

const epicColumns = [
  { title: 'Ключ', key: 'jiraKey', width: 120 },
  { title: 'Название', key: 'title', ellipsis: true },
  { title: 'Статус', key: 'status', width: 120 },
  {
    title: 'Связь', key: 'estimateTaskId', width: 100,
    render: (r: any) => r.estimateTaskId
      ? h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => '✓ Связан' })
      : h(NTag, { type: 'default', size: 'small', bordered: false }, { default: () => 'Нет' }),
  },
]

const taskColumns = [
  { title: 'Ключ', key: 'jiraKey', width: 120 },
  { title: 'Название', key: 'title', ellipsis: true },
  { title: 'Тип', key: 'type', width: 100 },
  { title: 'Исполнитель', key: 'assigneeRaw', width: 140 },
  { title: 'Статус', key: 'status', width: 120 },
  {
    title: 'Оценка (ч)', key: 'currentEstimateHours', width: 100,
    render: (r: any) => r.currentEstimateHours ?? '—',
  },
  {
    title: 'Факт (ч)', key: 'actualHours', width: 90,
    render: (r: any) => r.actualHours ?? '—',
  },
  {
    title: 'Проверка', key: 'needsReview', width: 100,
    render: (r: any) => r.dataQualityFlags?.length
      ? h(NTag, { type: 'warning', size: 'small', bordered: false }, { default: () => '⚠' })
      : null,
  },
]

const etColumns = [
  { title: 'Название', key: 'title', ellipsis: true },
  {
    title: 'Часы (план)', key: 'totalHours', width: 110,
    render: (r: any) => r.totalHours ?? '—',
  },
]

const riskColumns = [
  { title: 'Объект', key: 'title', ellipsis: true },
  { title: 'Уровень', key: 'level', width: 120 },
  {
    title: 'Статус', key: 'riskStatus', width: 90,
    render: (r: any) => h(NTag, { type: riskType(r.riskStatus), size: 'small', bordered: false }, {
      default: () => r.riskStatus?.toUpperCase() ?? '—',
    }),
  },
  { title: 'Причина', key: 'reason', ellipsis: true },
]

onMounted(async () => {
  await load()
  await Promise.all([loadBaseline(), loadJira(), loadAnalytics()])
})
</script>

<template>
  <div style="height: 100vh; display: flex; flex-direction: column; overflow: hidden;">

    <!-- Header -->
    <div style="padding: 16px 28px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0;">
      <div style="font-size: 18px; font-weight: 600; color: #e2e8f0;">
        {{ obj?.name ?? '...' }}
      </div>
      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
        {{ obj?.type }} · {{ obj?.startDate ?? '' }} — {{ obj?.plannedEndDate ?? '' }}
      </div>
    </div>

    <!-- Tabs -->
    <NTabs type="line" animated style="flex: 1; overflow: hidden; padding: 0 28px;"
           pane-style="overflow-y: auto; height: calc(100vh - 110px); padding: 16px 0;">

      <!-- Dashboard -->
      <NTabPane name="dashboard" tab="📊 Дашборд">
        <NSpin :show="analyticsLoading">
          <NGrid :cols="4" :x-gap="16" :y-gap="16" style="margin-bottom: 20px;" v-if="dashboard">
            <NGridItem>
              <NCard size="small">
                <NStatistic label="Baseline (ч)" :value="dashboard.baselineHours ?? 0" />
              </NCard>
            </NGridItem>
            <NGridItem>
              <NCard size="small">
                <NStatistic label="Факт (ч)" :value="dashboard.actualHours ?? 0" />
              </NCard>
            </NGridItem>
            <NGridItem>
              <NCard size="small">
                <NStatistic label="Задач оценки" :value="dashboard.estimateTasksCount ?? 0" />
              </NCard>
            </NGridItem>
            <NGridItem>
              <NCard size="small">
                <NStatistic label="Эпиков Jira" :value="dashboard.epicsCount ?? 0" />
              </NCard>
            </NGridItem>
          </NGrid>
          <NAlert v-if="!dashboard && !analyticsLoading" type="info">
            Загрузите baseline и Jira-выгрузку для отображения дашборда
          </NAlert>

          <!-- Risks -->
          <div v-if="risks.length" style="margin-top: 16px;">
            <div style="font-weight: 600; color: #e2e8f0; margin-bottom: 8px;">Риски</div>
            <NDataTable :columns="riskColumns" :data="risks" size="small" :pagination="{ pageSize: 10 }" />
          </div>
        </NSpin>
      </NTabPane>

      <!-- Baseline -->
      <NTabPane name="baseline" tab="📋 Baseline">
        <NSpin :show="baselineLoading">
          <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px;">
            <NUpload accept=".xlsx,.xls,.csv" :max="1" :show-file-list="false"
                     :custom-request="({ file }) => importBaseline({ file })">
              <NButton type="primary" :loading="baselineImporting" size="medium">
                📂 Загрузить baseline
              </NButton>
            </NUpload>
            <span v-if="baseline" style="font-size: 12px; color: #64748b;">
              {{ baseline.sourceFileName }} · {{ baseline.totalHours }} ч
            </span>
          </div>

          <NAlert v-if="!baseline && !baselineLoading" type="info" style="margin-bottom: 16px;">
            Загрузите файл «Шаблон плановой оценки.xlsx»
          </NAlert>

          <NDataTable v-if="estimateTasks.length" :columns="etColumns" :data="estimateTasks"
                      size="small" :pagination="{ pageSize: 20 }" />
        </NSpin>
      </NTabPane>

      <!-- Jira -->
      <NTabPane name="jira" tab="🔗 Jira">
        <NSpin :show="jiraLoading">
          <!-- Import form -->
          <NCard size="small" style="margin-bottom: 16px;">
            <div style="font-weight: 600; color: #e2e8f0; margin-bottom: 12px;">Импорт Jira-выгрузки</div>
            <NGrid :cols="3" :x-gap="12" style="margin-bottom: 12px;">
              <NGridItem>
                <NUpload accept=".xlsx,.xls,.csv" :max="1" :show-file-list="false"
                         :custom-request="({ file }) => { structureFile = file.file ?? null }">
                  <NButton size="small" :type="structureFile ? 'success' : 'default'">
                    {{ structureFile ? '✓ ' + structureFile.name : '📂 Файл структуры' }}
                  </NButton>
                </NUpload>
              </NGridItem>
              <NGridItem>
                <NUpload accept=".xlsx,.xls,.csv" :max="1" :show-file-list="false"
                         :custom-request="({ file }) => { worklogFile = file.file ?? null }">
                  <NButton size="small" :type="worklogFile ? 'success' : 'default'">
                    {{ worklogFile ? '✓ ' + worklogFile.name : '📂 Файл трудозатрат' }}
                  </NButton>
                </NUpload>
              </NGridItem>
              <NGridItem>
                <NInput v-model:value="deliveryKey" placeholder="Ключ поставки (опц.)" size="small" />
              </NGridItem>
            </NGrid>
            <NButton type="primary" :loading="jiraImporting" size="small" @click="importJira">
              Импортировать
            </NButton>
          </NCard>

          <!-- Epics -->
          <div v-if="epics.length">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 600; color: #e2e8f0;">Эпики ({{ epics.length }})</span>
              <NButton size="small" @click="autoLink">⚡ Авто-связка</NButton>
            </div>
            <NDataTable :columns="epicColumns" :data="epics" size="small"
                        :pagination="{ pageSize: 10 }" style="margin-bottom: 16px;" />
          </div>

          <!-- Tasks -->
          <div v-if="tasks.length">
            <div style="font-weight: 600; color: #e2e8f0; margin-bottom: 8px;">
              Задачи ({{ tasks.length }})
            </div>
            <NDataTable :columns="taskColumns" :data="tasks" size="small"
                        :pagination="{ pageSize: 15 }" :max-height="400" virtual-scroll />
          </div>

          <NAlert v-if="!epics.length && !jiraLoading" type="info">
            Загрузите файлы Jira-выгрузки
          </NAlert>
        </NSpin>
      </NTabPane>

      <!-- Data quality -->
      <NTabPane name="quality" tab="⚠ Проверка">
        <NSpin :show="analyticsLoading">
          <NAlert v-if="!dataQuality.length && !analyticsLoading" type="success">
            Проблем с данными не обнаружено
          </NAlert>
          <NDataTable v-if="dataQuality.length"
            :columns="[
              { title: 'Объект', key: 'title', ellipsis: true },
              { title: 'Тип', key: 'type', width: 120 },
              { title: 'Причина', key: 'reason', ellipsis: true },
            ]"
            :data="dataQuality" size="small" :pagination="{ pageSize: 20 }" />
        </NSpin>
      </NTabPane>

    </NTabs>
  </div>
</template>
