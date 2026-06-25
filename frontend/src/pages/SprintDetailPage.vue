<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { NTag, NSpin } from 'naive-ui'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useSprintsStore } from '@/stores/sprints.store'

const route = useRoute()
const router = useRouter()
const store = useSprintsStore()

const projectId = route.params.id as string
const sprintId = route.params.sprintId as string

const tabs = [
  { name: 'Tasks',   label: 'Задачи',      path: 'tasks' },
  { name: 'Kanban',  label: 'Канбан',      path: 'kanban' },
  { name: 'Estimates', label: 'Заявки',    path: 'estimates' },
  { name: 'Stats',   label: 'Статистика',  path: 'stats' },
  { name: 'AI',      label: '✦ AI',        path: 'ai' },
]

const activeTab = computed(() => route.name as string)

const statusConfig: Record<string, { color: string; label: string }> = {
  active:   { color: '#34d399', label: 'Активный' },
  planned:  { color: '#38bdf8', label: 'Запланирован' },
  archived: { color: '#64748b', label: 'Архив' },
}

onMounted(() => store.fetchOne(sprintId))
</script>

<template>
  <AppLayout>
    <NSpin v-if="store.loading" />
    <template v-else>
      <!-- Page header -->
      <div class="mb-5">
        <div class="flex items-center gap-2 mb-1">
          <button
            class="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            @click="router.push(`/projects/${projectId}`)"
          >
            ← Назад
          </button>
        </div>
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-semibold text-slate-200">{{ store.current?.name ?? 'Спринт' }}</h1>
          <NTag
            v-if="store.current"
            size="small"
            :bordered="false"
            :style="{
              background: statusConfig[store.current.status].color + '20',
              color: statusConfig[store.current.status].color,
            }"
          >
            {{ statusConfig[store.current.status].label }}
          </NTag>
        </div>
        <p v-if="store.current?.startDate" class="text-xs text-slate-500 mt-0.5">
          {{ store.current.startDate }} — {{ store.current.endDate ?? '…' }}
        </p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 mb-5 border-b border-edge">
        <button
          v-for="t in tabs"
          :key="t.name"
          class="px-3 py-2 text-xs font-medium transition-colors relative"
          :class="activeTab === t.name
            ? 'text-primary'
            : 'text-slate-500 hover:text-slate-300'"
          @click="router.push(`/projects/${projectId}/sprints/${sprintId}/${t.path}`)"
        >
          {{ t.label }}
          <span
            v-if="activeTab === t.name"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t"
          />
        </button>
      </div>

      <!-- Tab content -->
      <RouterView />
    </template>
  </AppLayout>
</template>
