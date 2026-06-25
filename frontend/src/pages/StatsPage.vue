<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NSpin, NAlert } from 'naive-ui'
import {
  Chart, ArcElement, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend, DoughnutController, BarController,
} from 'chart.js'
import { useStatsStore } from '@/stores/stats.store'

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, DoughnutController, BarController)

const route = useRoute()
const store = useStatsStore()
const sprintId = route.params.sprintId as string

const donutRef = ref<HTMLCanvasElement | null>(null)
const barRef = ref<HTMLCanvasElement | null>(null)
const estimateRef = ref<HTMLCanvasElement | null>(null)

let donutChart: Chart | null = null
let barChart: Chart | null = null
let estimateChart: Chart | null = null

const gridLabels = ['#64748b', '#38bdf8', '#fbbf24', '#34d399', '#f87171']

function buildCharts() {
  if (!store.stats) return
  const { tasks, departments, estimates } = store.stats

  donutChart?.destroy()
  if (donutRef.value) {
    donutChart = new Chart(donutRef.value, {
      type: 'doughnut',
      data: {
        labels: ['Todo', 'In Progress', 'Review', 'Done', 'Blocked'],
        datasets: [{ data: [tasks.todo, tasks.inProgress, tasks.review, tasks.done, tasks.blocked], backgroundColor: gridLabels, borderWidth: 0 }],
      },
      options: {
        cutout: '70%',
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 10, font: { size: 11 } } } },
      },
    })
  }

  barChart?.destroy()
  if (barRef.value) {
    barChart = new Chart(barRef.value, {
      type: 'bar',
      data: {
        labels: departments.map(d => d.name),
        datasets: [
          { label: 'Оценка (ч)', data: departments.map(d => d.estimatedHours), backgroundColor: '#4f7cff55', borderColor: '#4f7cff', borderWidth: 1 },
          { label: 'Факт (ч)', data: departments.map(d => d.actualHours), backgroundColor: '#38bdf855', borderColor: '#38bdf8', borderWidth: 1 },
        ],
      },
      options: {
        plugins: { legend: { labels: { color: '#94a3b8', boxWidth: 10, font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#243049' } },
          y: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#243049' } },
        },
      },
    })
  }

  estimateChart?.destroy()
  if (estimateRef.value) {
    estimateChart = new Chart(estimateRef.value, {
      type: 'doughnut',
      data: {
        labels: ['Связаны', 'Без задач'],
        datasets: [{ data: [estimates.linked, estimates.unlinked], backgroundColor: ['#34d399', '#64748b'], borderWidth: 0 }],
      },
      options: {
        cutout: '70%',
        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 10, font: { size: 11 } } } },
      },
    })
  }
}

onMounted(async () => { await store.fetchBySprint(sprintId); buildCharts() })
watch(() => store.stats, buildCharts)
onUnmounted(() => { donutChart?.destroy(); barChart?.destroy(); estimateChart?.destroy() })
</script>

<template>
  <NSpin v-if="store.loading" />
  <NAlert v-else-if="store.error" type="error" :title="store.error" />
  <template v-else-if="store.stats">
    <!-- KPI row -->
    <div class="grid grid-cols-4 gap-3 mb-5">
      <div v-for="(item, i) in [
        { label: 'Всего задач',   value: store.stats.tasks.total },
        { label: 'Завершено',     value: store.stats.tasks.done },
        { label: '% выполнения',  value: store.stats.tasks.completionPercent + '%' },
        { label: 'В работе',      value: store.stats.tasks.inProgress },
      ]" :key="i" class="rounded-lg bg-ink p-3 text-center">
        <p class="text-xs text-slate-500 mb-1">{{ item.label }}</p>
        <p class="text-base font-semibold text-slate-200">{{ item.value }}</p>
      </div>
    </div>

    <!-- Charts grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-xl border border-edge bg-panel/50 p-4">
        <p class="text-sm font-medium text-slate-300 mb-3">Задачи по статусам</p>
        <div style="height: 200px; position: relative"><canvas ref="donutRef" /></div>
      </div>

      <div class="rounded-xl border border-edge bg-panel/50 p-4">
        <p class="text-sm font-medium text-slate-300 mb-3">Заявки vs задачи</p>
        <div style="height: 200px; position: relative"><canvas ref="estimateRef" /></div>
      </div>

      <div class="rounded-xl border border-edge bg-panel/50 p-4 lg:col-span-1 sm:col-span-2">
        <p class="text-sm font-medium text-slate-300 mb-3">Часы по отделам</p>
        <div style="height: 200px; position: relative"><canvas ref="barRef" /></div>
      </div>
    </div>
  </template>
</template>
