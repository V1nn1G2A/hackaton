<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NButton, NCard, NProgress, NTag, NDataTable, NSpin,
  NAlert, NGrid, NGridItem, NStatistic, NUpload, NInput, NSpace,
} from 'naive-ui'
import Gauge from '@/components/Gauge.vue'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { veiApi } from '@/api/vei'

// ── State ──────────────────────────────────────────────────────────────────
const structureFile = ref<File | null>(null)
const worklogFile = ref<File | null>(null)
const deliveryKey = ref('MERVEIDEV-235')
const loading = ref(false)
const error = ref('')
const data = ref<any>(null)

// ── Upload handlers ─────────────────────────────────────────────────────────
function onStructure({ file, onFinish }: any) { structureFile.value = file.file; onFinish() }
function onWorklog({ file, onFinish }: any) { worklogFile.value = file.file; onFinish() }

async function analyze() {
  if (!structureFile.value || !worklogFile.value) {
    error.value = 'Загрузите оба файла'; return
  }
  loading.value = true; error.value = ''
  try {
    const res = await veiApi.analyze(structureFile.value, worklogFile.value, deliveryKey.value)
    data.value = res.data
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Ошибка анализа'
  } finally {
    loading.value = false }
}

// ── Computed ────────────────────────────────────────────────────────────────
const summary = computed(() => data.value?.summary ?? null)
const epics = computed(() => data.value?.epics ?? [])
const team = computed(() => data.value?.team ?? [])
const byStatus = computed(() => data.value?.byStatus ?? [])
const overdueEpics = computed(() => data.value?.overdueEpics ?? [])
const overdueTasks = computed(() => data.value?.overdueTasks ?? [])
const timeline = computed(() => data.value?.timeline ?? [])
const maxWeekHours = computed(() => Math.max(...timeline.value.map((t: any) => t.hours), 1))

function statusColor(status: string): string {
  const s = (status ?? '').toLowerCase()
  if (s === 'done' || s === 'closed' || s === 'resolved') return '#22c55e'
  if (s.includes('progress') || s.includes('в работ')) return '#60a5fa'
  if (s.includes('review')) return '#a78bfa'
  if (s.includes('open') || s.includes('to do') || s.includes('todo')) return '#94a3b8'
  return '#f59e0b'
}
function statusType(status: string): 'success' | 'info' | 'warning' | 'default' {
  const s = (status ?? '').toLowerCase()
  if (s === 'done' || s === 'closed') return 'success'
  if (s.includes('progress')) return 'info'
  if (s.includes('review')) return 'warning'
  return 'default'
}
function priorityColor(p: string): string {
  const s = (p ?? '').toLowerCase()
  if (s === 'blocker' || s === 'critical') return '#ef4444'
  if (s === 'high') return '#f59e0b'
  if (s === 'medium' || s === 'средний') return '#60a5fa'
  return '#94a3b8'
}
function fmt(n: number): string { return n?.toLocaleString('ru') ?? '0' }

// ── Tables ──────────────────────────────────────────────────────────────────
const epicColumns = [
  { title: 'Эпик', key: 'name', ellipsis: true, minWidth: 160 },
  { title: 'Статус', key: 'status', width: 110,
    render: (r: any) => h(NTag, { type: statusType(r.status), size: 'small', bordered: false }, { default: () => r.status ?? '—' }) },
  { title: 'Задач', key: 'tasksTotal', width: 70, render: (r: any) => `${r.tasksDone}/${r.tasksTotal}` },
  { title: 'Прогресс', key: 'progressPct', width: 160,
    render: (r: any) => h('div', { style: 'display:flex;align-items:center;gap:8px;' }, [
      h(NProgress, { type: 'line', percentage: r.progressPct, height: 8, borderRadius: 4, showIndicator: false,
        color: r.progressPct === 100 ? '#22c55e' : r.progressPct >= 50 ? '#60a5fa' : '#f59e0b',
        railColor: 'rgba(255,255,255,0.08)' }),
      h('span', { style: 'font-size:11px;color:#94a3b8;white-space:nowrap' }, r.progressPct + '%'),
    ]) },
  { title: 'Часов', key: 'hoursLogged', width: 80, render: (r: any) => fmt(r.hoursLogged) },
  { title: 'Срок', key: 'dueDate', width: 100,
    render: (r: any) => {
      if (!r.dueDate) return '—'
      const color = r.overdue && r.status !== 'Done' && r.status !== 'Closed' ? '#ef4444' : '#94a3b8'
      return h('span', { style: `color:${color}` }, r.dueDate)
    } },
]

const teamColumns = [
  { title: 'Исполнитель', key: 'name', ellipsis: true, minWidth: 140 },
  { title: 'Задач', key: 'tasksTotal', width: 80,
    render: (r: any) => h('span', {}, `${r.tasksDone}/${r.tasksTotal}`) },
  { title: 'Выполнено', key: 'donePct', width: 140,
    render: (r: any) => h(NProgress, { type: 'line', percentage: r.donePct, height: 8, borderRadius: 4, showIndicator: false,
      color: r.donePct >= 80 ? '#22c55e' : r.donePct >= 50 ? '#60a5fa' : '#f59e0b',
      railColor: 'rgba(255,255,255,0.08)' }) },
  { title: '% done', key: 'donePct', width: 70, render: (r: any) => r.donePct + '%' },
  { title: 'Часов', key: 'hoursLogged', width: 80, render: (r: any) => fmt(r.hoursLogged) },
  { title: 'Просроч.', key: 'tasksOverdue', width: 80,
    render: (r: any) => r.tasksOverdue > 0
      ? h(NTag, { type: 'error', size: 'small', bordered: false }, { default: () => r.tasksOverdue })
      : h('span', { style: 'color:#64748b' }, '—') },
]

import { h } from 'vue'
</script>

<template>
  <AppLayout>
  <div style="min-height:100vh; color:#e2e8f0; font-family:Inter,sans-serif;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e2a45 0%,#0d1117 100%); border-bottom:1px solid rgba(255,255,255,0.08); padding:20px 32px; display:flex; align-items:center; justify-content:space-between;">
      <div>
        <div style="font-size:22px; font-weight:700; color:#e2e8f0; letter-spacing:-0.3px;">
          📊 ВЭИ — Аналитика проекта
        </div>
        <div style="font-size:13px; color:#64748b; margin-top:3px;">
          Advanced Roadmaps · Трудозатраты · Команда · Дедлайны
        </div>
      </div>
      <NTag type="info" :bordered="false" style="font-size:12px;">
        {{ summary ? summary.deliveryName : 'Данные не загружены' }}
      </NTag>
    </div>

    <!-- Upload zone -->
    <div style="padding:24px 32px; border-bottom:1px solid rgba(255,255,255,0.05);">
      <div style="display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap;">

        <div style="flex:1; min-width:220px;">
          <div style="font-size:11px; color:#64748b; margin-bottom:6px; font-weight:500; text-transform:uppercase; letter-spacing:.06em;">
            Файл структуры (Advanced Roadmaps)
          </div>
          <NUpload accept=".xlsx,.xls" :max="1" :show-file-list="false" :custom-request="onStructure">
            <NButton
              :type="structureFile ? 'success' : 'default'"
              style="width:100%; justify-content:flex-start;"
            >
              {{ structureFile ? '✓ ' + structureFile.name : '📂 Выбрать файл структуры' }}
            </NButton>
          </NUpload>
        </div>

        <div style="flex:1; min-width:220px;">
          <div style="font-size:11px; color:#64748b; margin-bottom:6px; font-weight:500; text-transform:uppercase; letter-spacing:.06em;">
            Файл трудозатрат (Worklog)
          </div>
          <NUpload accept=".xlsx,.xls" :max="1" :show-file-list="false" :custom-request="onWorklog">
            <NButton
              :type="worklogFile ? 'success' : 'default'"
              style="width:100%; justify-content:flex-start;"
            >
              {{ worklogFile ? '✓ ' + worklogFile.name : '⏱ Выбрать файл трудозатрат' }}
            </NButton>
          </NUpload>
        </div>

        <div style="width:200px;">
          <div style="font-size:11px; color:#64748b; margin-bottom:6px; font-weight:500; text-transform:uppercase; letter-spacing:.06em;">
            Ключ поставки
          </div>
          <NInput v-model:value="deliveryKey" placeholder="MERVEIDEV-235" />
        </div>

        <NButton
          type="primary"
          size="large"
          :loading="loading"
          :disabled="!structureFile || !worklogFile"
          style="height:34px; min-width:140px;"
          @click="analyze"
        >
          🚀 Анализировать
        </NButton>
      </div>

      <NAlert v-if="error" type="error" :title="error" :bordered="false" style="margin-top:12px;" />
    </div>

    <!-- Empty state -->
    <div v-if="!data && !loading" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:50vh;gap:16px;text-align:center;color:#475569;">
      <div style="font-size:56px;">📂</div>
      <div style="font-size:16px; font-weight:500; color:#64748b;">Загрузите два файла и нажмите «Анализировать»</div>
      <div style="font-size:13px; color:#334155;">
        Структура задач (Advanced Roadmaps) + Трудозатраты (Worklog) → полная аналитика проекта
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="display:flex;align-items:center;justify-content:center;min-height:50vh;">
      <NSpin size="large" />
    </div>

    <!-- Dashboard -->
    <div v-if="data && !loading" style="padding:24px 32px; display:flex; flex-direction:column; gap:24px;">

      <!-- KPI Row -->
      <NGrid :cols="6" :x-gap="12" :y-gap="12">
        <NGridItem>
          <NCard size="small" style="background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.07);">
            <NStatistic label="Задач всего" :value="summary.totalTasks" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" style="background:rgba(34,197,94,0.06);border-color:rgba(34,197,94,0.2);">
            <NStatistic label="Закрыто" :value="summary.doneTasks" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" style="background:rgba(96,165,250,0.06);border-color:rgba(96,165,250,0.2);">
            <NStatistic label="В работе" :value="summary.inProgressTasks" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" style="background:rgba(239,68,68,0.06);border-color:rgba(239,68,68,0.2);">
            <NStatistic label="Просрочено" :value="summary.overdueTasks" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" style="background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.07);">
            <NStatistic label="Эпиков" :value="`${summary.doneEpics}/${summary.totalEpics}`" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" style="background:rgba(251,191,36,0.06);border-color:rgba(251,191,36,0.2);">
            <NStatistic label="Часов списано" :value="fmt(summary.totalHoursLogged)" />
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- Gauges row -->
      <NCard size="small" style="background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.07);">
        <div style="display:flex; gap:32px; align-items:center; flex-wrap:wrap; justify-content:center; padding:8px 0;">

          <!-- Overall task progress -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
            <Gauge
              :percentage="summary.progressPct"
              :size="180"
              label="Прогресс задач"
              :sublabel="`${summary.doneTasks} из ${summary.totalTasks}`"
            />
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%;">
              <div style="text-align:center;background:rgba(255,255,255,0.03);border-radius:8px;padding:8px 6px;">
                <div style="font-size:16px;font-weight:600;color:#22c55e;">{{ summary.doneTasks }}</div>
                <div style="font-size:10px;color:#64748b;">закрыто</div>
              </div>
              <div style="text-align:center;background:rgba(255,255,255,0.03);border-radius:8px;padding:8px 6px;">
                <div style="font-size:16px;font-weight:600;color:#60a5fa;">{{ summary.inProgressTasks }}</div>
                <div style="font-size:10px;color:#64748b;">в работе</div>
              </div>
            </div>
          </div>

          <!-- Epic progress -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
            <Gauge
              :percentage="summary.epicProgressPct"
              :size="180"
              label="Прогресс эпиков"
              :sublabel="`${summary.doneEpics} из ${summary.totalEpics}`"
            />
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%;">
              <div style="text-align:center;background:rgba(255,255,255,0.03);border-radius:8px;padding:8px 6px;">
                <div style="font-size:16px;font-weight:600;color:#ef4444;">{{ summary.overdueEpics }}</div>
                <div style="font-size:10px;color:#64748b;">просроч. эпиков</div>
              </div>
              <div style="text-align:center;background:rgba(255,255,255,0.03);border-radius:8px;padding:8px 6px;">
                <div style="font-size:16px;font-weight:600;color:#f59e0b;">{{ summary.overdueTasks }}</div>
                <div style="font-size:10px;color:#64748b;">просроч. задач</div>
              </div>
            </div>
          </div>

          <!-- Status breakdown mini-gauges -->
          <div style="flex:1;min-width:280px;">
            <div style="font-size:12px;color:#64748b;font-weight:500;margin-bottom:14px;">Разбивка по статусам</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div v-for="s in byStatus.slice(0,8)" :key="s.status" style="display:flex;align-items:center;gap:10px;">
                <div style="width:12px;height:12px;border-radius:50%;flex-shrink:0;" :style="{ background: statusColor(s.status) }" />
                <div style="flex:1;min-width:0;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="font-size:12px;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;">{{ s.status }}</span>
                    <span style="font-size:11px;color:#64748b;margin-left:8px;">{{ s.count }} ({{ s.pct }}%)</span>
                  </div>
                  <NProgress type="line" :percentage="s.pct" :height="6" :border-radius="3"
                    :show-indicator="false" :color="statusColor(s.status)" :rail-color="'rgba(255,255,255,0.06)'" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </NCard>

      <!-- Burning / overdue -->
      <div v-if="overdueEpics.length || overdueTasks.length" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

        <div v-if="overdueEpics.length"
          style="border-radius:12px;border:1px solid rgba(239,68,68,0.3);background:rgba(239,68,68,0.05);padding:16px;">
          <div style="font-size:13px;font-weight:600;color:#f87171;margin-bottom:12px;">
            🔥 Просроченные эпики ({{ overdueEpics.length }})
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;">
            <div v-for="e in overdueEpics" :key="e.key"
              style="border-radius:8px;border:1px solid rgba(239,68,68,0.2);background:rgba(15,20,30,0.6);padding:10px 12px;">
              <div style="font-size:12px;font-weight:500;color:#e2e8f0;">{{ e.key }} — {{ e.name }}</div>
              <div style="font-size:11px;color:#ef4444;margin-top:2px;">
                срок: {{ e.dueDate }} · {{ e.tasksDone }}/{{ e.tasksTotal }} задач
              </div>
            </div>
          </div>
        </div>

        <div v-if="overdueTasks.length"
          style="border-radius:12px;border:1px solid rgba(245,158,11,0.3);background:rgba(245,158,11,0.05);padding:16px;">
          <div style="font-size:13px;font-weight:600;color:#fbbf24;margin-bottom:12px;">
            ⚠ Просроченные задачи ({{ overdueTasks.length }})
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto;">
            <div v-for="t in overdueTasks.slice(0,20)" :key="t.key"
              style="border-radius:6px;border:1px solid rgba(245,158,11,0.15);background:rgba(15,20,30,0.6);padding:8px 10px;font-size:11px;">
              <div style="color:#e2e8f0;font-weight:500;">{{ t.key }} — {{ t.name }}</div>
              <div style="color:#94a3b8;margin-top:2px;">{{ t.assigneeRaw ?? 'не назначено' }} · {{ t.status }} · срок: {{ t.dueDate }}</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Main content: epics + team -->
      <div style="display:grid;grid-template-columns:3fr 2fr;gap:20px;align-items:start;">

        <!-- Epics table -->
        <NCard size="small" title="Эпики" style="background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.07);">
          <NDataTable
            :columns="epicColumns"
            :data="epics"
            :pagination="{ pageSize: 15 }"
            size="small"
            :bordered="false"
            :max-height="500"
          />
        </NCard>

        <!-- Team performance -->
        <NCard size="small" title="Производительность команды" style="background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.07);">
          <div style="display:flex;flex-direction:column;gap:8px;max-height:500px;overflow-y:auto;">
            <div
              v-for="(member, i) in team.slice(0, 20)"
              :key="member.name"
              style="border-radius:8px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);padding:10px 12px;"
            >
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                  <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#4f7cff,#a78bfa);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;flex-shrink:0;">
                    {{ (member.name?.[0] ?? '?').toUpperCase() }}
                  </div>
                  <span style="font-size:12px;font-weight:500;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;">
                    {{ member.name }}
                  </span>
                </div>
                <div style="text-align:right;flex-shrink:0;margin-left:8px;">
                  <div style="font-size:14px;font-weight:600;color:#34d399;">{{ fmt(member.hoursLogged) }}ч</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <NProgress type="line" :percentage="member.donePct" :height="6" :border-radius="3"
                  :show-indicator="false"
                  :color="member.donePct >= 80 ? '#22c55e' : member.donePct >= 50 ? '#60a5fa' : '#f59e0b'"
                  :rail-color="'rgba(255,255,255,0.06)'" style="flex:1;" />
                <span style="font-size:11px;color:#64748b;white-space:nowrap;">
                  {{ member.tasksDone }}/{{ member.tasksTotal }}
                </span>
                <NTag v-if="member.tasksOverdue > 0" type="error" size="tiny" :bordered="false">
                  🔥{{ member.tasksOverdue }}
                </NTag>
              </div>
            </div>
          </div>
        </NCard>

      </div>

      <!-- Timeline / Burndown -->
      <NCard v-if="timeline.length" size="small" title="Трудозатраты по неделям (ч)"
        style="background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.07);">
        <div style="display:flex;align-items:flex-end;gap:4px;height:140px;overflow-x:auto;padding-bottom:4px;">
          <div
            v-for="w in timeline"
            :key="w.week"
            style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;min-width:44px;"
          >
            <div style="font-size:10px;color:#94a3b8;white-space:nowrap;">{{ fmt(w.hours) }}ч</div>
            <div
              style="width:36px;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#4f7cff,#6366f1);min-height:4px;transition:height 0.3s;"
              :style="{ height: Math.max(4, Math.round((w.hours / maxWeekHours) * 100)) + 'px' }"
            />
            <div style="font-size:9px;color:#475569;white-space:nowrap;transform:rotate(-40deg);transform-origin:top center;margin-top:8px;">
              {{ w.week.slice(5) }}
            </div>
          </div>
        </div>
      </NCard>

      <!-- Full team table -->
      <NCard size="small" title="Таблица команды"
        style="background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.07);">
        <NDataTable
          :columns="teamColumns"
          :data="team"
          :pagination="{ pageSize: 20 }"
          size="small"
          :bordered="false"
          :max-height="400"
        />
      </NCard>

    </div>
  </div>
  </AppLayout>
</template>
