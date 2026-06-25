<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NDataTable, NSpin, NTag, NCard, NGrid, NGridItem, NAlert } from 'naive-ui'
import { controlObjectsApi } from '@/api/controlObjects'

const route = useRoute()
const router = useRouter()
const id = route.params.id as string

const obj = ref<any>(null)
const epics = ref<any[]>([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const [objRes, epicsRes] = await Promise.allSettled([
      controlObjectsApi.getById(id),
      controlObjectsApi.getEpics(id),
    ])
    if (objRes.status === 'fulfilled') obj.value = objRes.value.data
    if (epicsRes.status === 'fulfilled') epics.value = epicsRes.value.data
  } finally { loading.value = false }
}

onMounted(load)

// ─── helpers ──────────────────────────────────────────────────────────────────

const today = new Date()
today.setHours(0, 0, 0, 0)

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function daysDiff(d: Date): number {
  const diff = d.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function riskType(level: string): 'error' | 'warning' | 'success' | 'default' {
  if (level === 'red') return 'error'
  if (level === 'yellow') return 'warning'
  if (level === 'green') return 'success'
  return 'default'
}

// ─── Группировка эпиков по срокам ─────────────────────────────────────────────

const epicsWithDate = computed(() => {
  return epics.value
    .filter(e => parseDate(e.dueDate))
    .map(e => {
      const d = parseDate(e.dueDate)!
      const days = daysDiff(d)
      let status: 'overdue' | 'today' | 'soon' | 'ok'
      if (days < 0) status = 'overdue'
      else if (days === 0) status = 'today'
      else if (days <= 3) status = 'soon'
      else status = 'ok'
      return { ...e, daysLeft: days, deadlineStatus: status }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
})

const epicsNoDate = computed(() => epics.value.filter(e => !parseDate(e.dueDate)))

const overdue = computed(() => epicsWithDate.value.filter(e => e.deadlineStatus === 'overdue'))
const dueToday = computed(() => epicsWithDate.value.filter(e => e.deadlineStatus === 'today'))
const dueSoon = computed(() => epicsWithDate.value.filter(e => e.deadlineStatus === 'soon'))
const ok = computed(() => epicsWithDate.value.filter(e => e.deadlineStatus === 'ok'))

// ─── Table ────────────────────────────────────────────────────────────────────

const columns = [
  { title: 'Ключ', key: 'jiraKey', width: 120 },
  { title: 'Название', key: 'title', ellipsis: true },
  { title: 'Статус', key: 'status', width: 120 },
  {
    title: 'Due Date', key: 'dueDate', width: 120,
    render: (r: any) => {
      const d = parseDate(r.dueDate)
      return d ? d.toLocaleDateString('ru') : '—'
    },
  },
  {
    title: 'Осталось', key: 'daysLeft', width: 110,
    render: (r: any) => {
      if (r.daysLeft == null) return '—'
      const color = r.daysLeft < 0 ? '#ef4444' : r.daysLeft === 0 ? '#f59e0b' : r.daysLeft <= 3 ? '#f59e0b' : '#22c55e'
      const text = r.daysLeft < 0 ? `${Math.abs(r.daysLeft)} дн. просрочено` : r.daysLeft === 0 ? 'Сегодня' : `${r.daysLeft} дн.`
      return h('span', { style: { color, fontWeight: 600 } }, text)
    },
  },
  { title: 'Факт (ч)', key: 'actualHours', width: 100, render: (r: any) => r.actualHours ?? '—' },
  {
    title: 'Риск', key: 'risk', width: 90,
    render: (r: any) => h(NTag, { type: riskType(r.risk), size: 'small', bordered: false }, { default: () => r.risk?.toUpperCase() ?? '—' }),
  },
]

const noDateColumns = [
  { title: 'Ключ', key: 'jiraKey', width: 120 },
  { title: 'Название', key: 'title', ellipsis: true },
  { title: 'Статус', key: 'status', width: 120 },
  { title: 'Факт (ч)', key: 'actualHours', width: 100, render: (r: any) => r.actualHours ?? '—' },
  {
    title: 'Риск', key: 'risk', width: 90,
    render: (r: any) => h(NTag, { type: riskType(r.risk), size: 'small', bordered: false }, { default: () => r.risk?.toUpperCase() ?? '—' }),
  },
]
</script>

<template>
  <div style="height: 100vh; display: flex; flex-direction: column; overflow: hidden;">

    <!-- Header -->
    <div style="padding: 14px 28px; border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-size: 17px; font-weight: 600; color: #e2e8f0;">
          📅 Контроль сроков · {{ obj?.name ?? '...' }}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
          Эпиков со сроком: {{ epicsWithDate.length }} · Без срока: {{ epicsNoDate.length }}
        </div>
      </div>
      <NButton size="small" @click="router.push(`/control-objects/${id}`)">← Dashboard</NButton>
    </div>

    <!-- Body -->
    <NSpin :show="loading" style="flex: 1; overflow: hidden;">
      <div style="overflow-y: auto; height: calc(100vh - 65px); padding: 20px 28px; display: flex; flex-direction: column; gap: 20px;">

        <!-- Summary cards -->
        <NGrid :cols="4" :x-gap="12">
          <NGridItem>
            <NCard size="small" style="background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.2);">
              <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Просрочено</div>
              <div style="font-size: 28px; font-weight: 700; color: #ef4444;">{{ overdue.length }}</div>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard size="small" style="background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.2);">
              <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Срок сегодня</div>
              <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">{{ dueToday.length }}</div>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard size="small" style="background: rgba(245,158,11,0.05); border-color: rgba(245,158,11,0.15);">
              <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Срок ≤ 3 дней</div>
              <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">{{ dueSoon.length }}</div>
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard size="small" style="background: rgba(34,197,94,0.05); border-color: rgba(34,197,94,0.15);">
              <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">В норме</div>
              <div style="font-size: 28px; font-weight: 700; color: #22c55e;">{{ ok.length }}</div>
            </NCard>
          </NGridItem>
        </NGrid>

        <!-- Overdue -->
        <div v-if="overdue.length">
          <div style="font-size: 13px; font-weight: 600; color: #ef4444; margin-bottom: 8px;">
            🔴 Просрочено ({{ overdue.length }})
          </div>
          <NDataTable :columns="columns" :data="overdue" size="small" :bordered="false" :pagination="false" />
        </div>

        <!-- Due today -->
        <div v-if="dueToday.length">
          <div style="font-size: 13px; font-weight: 600; color: #f59e0b; margin-bottom: 8px;">
            🟡 Срок сегодня ({{ dueToday.length }})
          </div>
          <NDataTable :columns="columns" :data="dueToday" size="small" :bordered="false" :pagination="false" />
        </div>

        <!-- Due soon -->
        <div v-if="dueSoon.length">
          <div style="font-size: 13px; font-weight: 600; color: #f59e0b; margin-bottom: 8px;">
            🟡 Срок ≤ 3 дней ({{ dueSoon.length }})
          </div>
          <NDataTable :columns="columns" :data="dueSoon" size="small" :bordered="false" :pagination="false" />
        </div>

        <!-- OK -->
        <div v-if="ok.length">
          <div style="font-size: 13px; font-weight: 600; color: #22c55e; margin-bottom: 8px;">
            🟢 В норме ({{ ok.length }})
          </div>
          <NDataTable :columns="columns" :data="ok" size="small" :bordered="false" :pagination="{ pageSize: 15 }" />
        </div>

        <!-- No date -->
        <div v-if="epicsNoDate.length">
          <div style="font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 8px;">
            ⚪ Без срока ({{ epicsNoDate.length }})
          </div>
          <NDataTable :columns="noDateColumns" :data="epicsNoDate" size="small" :bordered="false" :pagination="{ pageSize: 10 }" />
        </div>

        <NAlert v-if="!loading && !epics.length" type="info">
          Нет эпиков — загрузите Jira-выгрузку
        </NAlert>

      </div>
    </NSpin>
  </div>
</template>
