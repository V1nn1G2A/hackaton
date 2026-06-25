<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton, NDataTable, NSpin, NTag, NCard, NTabs, NTabPane,
  NSelect, NSpace, useMessage,
} from 'naive-ui'
import { controlObjectsApi } from '@/api/controlObjects'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

// фильтр из query (?direction=backend или ?role=qa)
const filterDirection = ref((route.query.direction as string) || '')
const filterRole = ref((route.query.role as string) || '')

const obj = ref<any>(null)
const data = ref<any>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const [objRes, cmpRes] = await Promise.allSettled([
      controlObjectsApi.getById(id),
      controlObjectsApi.getComparison(id),
    ])
    if (objRes.status === 'fulfilled') obj.value = objRes.value.data
    if (cmpRes.status === 'fulfilled') data.value = cmpRes.value.data
  } finally { loading.value = false }
}

onMounted(load)

// ─── helpers ──────────────────────────────────────────────────────────────────

function riskType(level: string): 'error' | 'warning' | 'success' | 'default' {
  if (level === 'red') return 'error'
  if (level === 'yellow') return 'warning'
  if (level === 'green') return 'success'
  return 'default'
}

function fmt(n: any) {
  if (n == null) return '—'
  return Number(n).toLocaleString('ru')
}

function fmtPct(n: any) {
  if (n == null) return '—'
  return Number(n).toFixed(1) + '%'
}

function deviationCell(v: number) {
  const color = v > 0 ? '#ef4444' : v < 0 ? '#22c55e' : '#94a3b8'
  return h('span', { style: { color, fontWeight: 600 } }, (v > 0 ? '+' : '') + fmt(v))
}

// ─── Direction table ──────────────────────────────────────────────────────────

const directionOptions = computed(() =>
  [{ label: 'Все направления', value: '' },
    ...(data.value?.byDirection ?? []).map((d: any) => ({ label: d.direction, value: d.direction }))]
)

const filteredDirections = computed(() => {
  const rows = data.value?.byDirection ?? []
  if (!filterDirection.value) return rows
  return rows.filter((r: any) => r.direction === filterDirection.value)
})

const directionColumns = [
  { title: 'Направление', key: 'direction' },
  { title: 'Baseline (ч)', key: 'baselineHours', width: 120, render: (r: any) => fmt(r.baselineHours) },
  { title: 'Факт (ч)', key: 'actualHours', width: 110, render: (r: any) => fmt(r.actualHours) },
  { title: 'Откл. (ч)', key: 'deviation', width: 110, render: (r: any) => deviationCell(r.deviation ?? 0) },
  { title: 'Использ. %', key: 'usagePercent', width: 120, render: (r: any) => fmtPct(r.usagePercent) },
  {
    title: 'Риск', key: 'risk', width: 90,
    render: (r: any) => h(NTag, { type: riskType(r.risk), size: 'small', bordered: false }, { default: () => r.risk?.toUpperCase() ?? '—' }),
  },
]

// ─── Role table ───────────────────────────────────────────────────────────────

const roleOptions = computed(() =>
  [{ label: 'Все роли', value: '' },
    ...(data.value?.byRole ?? []).map((r: any) => ({ label: r.role, value: r.role }))]
)

const filteredRoles = computed(() => {
  const rows = data.value?.byRole ?? []
  if (!filterRole.value) return rows
  return rows.filter((r: any) => r.role === filterRole.value)
})

const roleColumns = [
  { title: 'Роль', key: 'role' },
  { title: 'Направление', key: 'direction', width: 120 },
  { title: 'Baseline (ч)', key: 'baselineHours', width: 120, render: (r: any) => fmt(r.baselineHours) },
  { title: 'Факт (ч)', key: 'actualHours', width: 110, render: (r: any) => fmt(r.actualHours) },
  { title: 'Откл. (ч)', key: 'deviation', width: 110, render: (r: any) => deviationCell(r.deviation ?? 0) },
  { title: 'Использ. %', key: 'usagePercent', width: 120, render: (r: any) => fmtPct(r.usagePercent) },
  {
    title: 'Риск', key: 'risk', width: 90,
    render: (r: any) => h(NTag, { type: riskType(r.risk), size: 'small', bordered: false }, { default: () => r.risk?.toUpperCase() ?? '—' }),
  },
]

// ─── EstimateTask table ───────────────────────────────────────────────────────

const etColumns = [
  { title: 'Задача оценки', key: 'title', ellipsis: true },
  { title: 'Baseline (ч)', key: 'baselineHours', width: 120, render: (r: any) => fmt(r.baselineHours) },
  { title: 'Факт (ч)', key: 'actualHours', width: 110, render: (r: any) => fmt(r.actualHours) },
  { title: 'Откл. (ч)', key: 'deviation', width: 110, render: (r: any) => deviationCell(r.deviation ?? 0) },
  { title: 'Использ. %', key: 'usagePercent', width: 120, render: (r: any) => fmtPct(r.usagePercent) },
  { title: 'Эпиков', key: 'linkedEpicCount', width: 80 },
  {
    title: 'Риск', key: 'risk', width: 90,
    render: (r: any) => h(NTag, { type: riskType(r.risk), size: 'small', bordered: false }, { default: () => r.risk?.toUpperCase() ?? '—' }),
  },
]

// ─── Epic table ───────────────────────────────────────────────────────────────

const epicColumns = [
  { title: 'Ключ', key: 'jiraKey', width: 120 },
  { title: 'Название', key: 'title', ellipsis: true },
  { title: 'Статус', key: 'status', width: 120 },
  { title: 'Baseline (ч)', key: 'baselineHours', width: 120, render: (r: any) => fmt(r.baselineHours) },
  { title: 'Факт (ч)', key: 'actualHours', width: 110, render: (r: any) => fmt(r.actualHours) },
  { title: 'Откл. (ч)', key: 'deviation', width: 110, render: (r: any) => deviationCell(r.deviation ?? 0) },
  { title: 'Использ. %', key: 'usagePercent', width: 120, render: (r: any) => fmtPct(r.usagePercent) },
  { title: 'Due Date', key: 'dueDate', width: 110 },
  {
    title: 'Риск', key: 'risk', width: 90,
    render: (r: any) => h(NTag, { type: riskType(r.risk), size: 'small', bordered: false }, { default: () => r.risk?.toUpperCase() ?? '—' }),
  },
]

// сортировка по риску
const order: Record<string, number> = { red: 0, yellow: 1, grey: 2, green: 3 }
const sortedEts = computed(() =>
  [...(data.value?.estimateTasks ?? [])].sort((a, b) => (order[a.risk] ?? 9) - (order[b.risk] ?? 9))
)
const sortedEpics = computed(() =>
  [...(data.value?.epics ?? [])].sort((a, b) => (order[a.risk] ?? 9) - (order[b.risk] ?? 9))
)

// итого по проекту
const project = computed(() => data.value?.project)
</script>

<template>
  <div style="height: 100vh; display: flex; flex-direction: column; overflow: hidden;">

    <!-- Header -->
    <div style="padding: 14px 28px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-size: 17px; font-weight: 600; color: #e2e8f0;">
          📊 Comparison · {{ obj?.name ?? '...' }}
        </div>
        <div v-if="project" style="font-size: 12px; color: #64748b; margin-top: 2px;">
          Baseline: {{ fmt(project.baselineHours) }} ч · Факт: {{ fmt(project.actualHours) }} ч · Использование: {{ fmtPct(project.usagePercent) }}
        </div>
      </div>
      <NButton size="small" @click="router.push(`/control-objects/${id}`)">← Dashboard</NButton>
    </div>

    <!-- Body -->
    <NSpin :show="loading" style="flex: 1; overflow: hidden;">
      <div style="overflow-y: auto; height: calc(100vh - 65px); padding: 20px 28px; display: flex; flex-direction: column; gap: 20px;">

        <!-- Project summary card -->
        <div v-if="project" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;">
          <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Baseline</div>
            <div style="font-size: 20px; font-weight: 700; color: #e2e8f0;">{{ fmt(project.baselineHours) }} ч</div>
          </NCard>
          <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Факт</div>
            <div style="font-size: 20px; font-weight: 700; color: #e2e8f0;">{{ fmt(project.actualHours) }} ч</div>
          </NCard>
          <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Отклонение</div>
            <div style="font-size: 20px; font-weight: 700;" :style="{ color: (project.deviation ?? 0) > 0 ? '#ef4444' : '#22c55e' }">
              {{ (project.deviation > 0 ? '+' : '') + fmt(project.deviation) }} ч
            </div>
          </NCard>
          <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Использование</div>
            <div style="font-size: 20px; font-weight: 700;" :style="{ color: (project.usagePercent ?? 0) > 100 ? '#ef4444' : '#22c55e' }">
              {{ fmtPct(project.usagePercent) }}
            </div>
          </NCard>
          <NCard size="small" style="background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.07);">
            <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Риск проекта</div>
            <NTag :type="riskType(project.risk)" size="medium" :bordered="false" style="margin-top: 4px;">
              {{ project.risk?.toUpperCase() ?? '—' }}
            </NTag>
          </NCard>
        </div>

        <!-- Tabs -->
        <NTabs type="line" animated>

          <!-- По направлениям -->
          <NTabPane name="direction" tab="По направлениям">
            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
              <NSelect v-model:value="filterDirection" :options="directionOptions"
                size="small" style="width: 220px;" />
            </div>
            <NDataTable :columns="directionColumns" :data="filteredDirections"
              size="small" :bordered="false" :pagination="false" />
          </NTabPane>

          <!-- По ролям -->
          <NTabPane name="role" tab="По ролям">
            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
              <NSelect v-model:value="filterRole" :options="roleOptions"
                size="small" style="width: 220px;" />
            </div>
            <NDataTable :columns="roleColumns" :data="filteredRoles"
              size="small" :bordered="false" :pagination="false" />
          </NTabPane>

          <!-- Задачи оценки -->
          <NTabPane name="estimate-tasks" tab="Задачи оценки">
            <NDataTable :columns="etColumns" :data="sortedEts"
              size="small" :bordered="false" :pagination="{ pageSize: 20 }" />
          </NTabPane>

          <!-- Эпики -->
          <NTabPane name="epics" tab="Jira Epic">
            <NDataTable :columns="epicColumns" :data="sortedEpics"
              size="small" :bordered="false" :pagination="{ pageSize: 20 }" />
          </NTabPane>

        </NTabs>
      </div>
    </NSpin>
  </div>
</template>
