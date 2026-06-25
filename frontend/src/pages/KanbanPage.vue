<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { NTag, NText, NSelect, NSpin, NAlert } from 'naive-ui'
import { useTasksStore } from '@/stores/tasks.store'
import { mockUsers } from '@/api/mocks'
import type { Task, TaskStatus, TaskType } from '@/types'

const route = useRoute()
const store = useTasksStore()
const sprintId = route.params.sprintId as string

const columns: { key: TaskStatus; label: string; dot: string }[] = [
  { key: 'todo',        label: 'Todo',        dot: '#64748b' },
  { key: 'in_progress', label: 'In Progress', dot: '#38bdf8' },
  { key: 'review',      label: 'Review',      dot: '#fbbf24' },
  { key: 'done',        label: 'Done',        dot: '#34d399' },
  { key: 'blocked',     label: 'Blocked',     dot: '#f87171' },
]

const typeColors: Record<TaskType, string> = {
  frontend:   '#4f7cff', backend:    '#38bdf8', qa:         '#34d399',
  devops:     '#fbbf24', analytics:  '#a78bfa', techwriter: '#f472b6',
  project:    '#2dd4bf', other:      '#64748b',
}

const filterType = ref<TaskType[]>([])
const filterAssignee = ref<string | null>(null)
const typeOptions = (['frontend','backend','qa','devops','analytics','techwriter','project','other'] as TaskType[])
  .map(v => ({ label: v, value: v }))
const userOptions = mockUsers.map(u => ({ label: `${u.firstName} ${u.lastName}`, value: u.id }))

function getUser(id?: string) {
  if (!id) return null
  return mockUsers.find(u => u.id === id)
}

function allTasks(list: Task[]): Task[] {
  return list.flatMap(t => [t, ...allTasks(t.children ?? [])])
}

const flat = computed(() => allTasks(store.tasks))

function colTasks(status: TaskStatus) {
  let list = flat.value.filter(t => t.status === status)
  if (filterType.value.length) list = list.filter(t => filterType.value.includes(t.type))
  if (filterAssignee.value) list = list.filter(t => t.assigneeId === filterAssignee.value)
  return list
}

// Drag & drop
let dragId = ''
const dropTarget = ref<TaskStatus | null>(null)

function onDragStart(id: string) { dragId = id }
function onDragEnter(col: TaskStatus) { dropTarget.value = col }
function onDragLeave() { dropTarget.value = null }
function onDrop(status: TaskStatus) {
  if (dragId) store.updateStatus(dragId, status)
  dragId = ''
  dropTarget.value = null
}

const isBlocked = (t: Task) => t.status === 'blocked'

onMounted(() => store.fetchBySprint(sprintId))
</script>

<template>
  <NSpin v-if="store.loading" />
  <NAlert v-else-if="store.error" type="error" :title="store.error" />
  <template v-else>
    <!-- Filters -->
    <div class="flex gap-3 mb-4 flex-wrap">
      <NSelect v-model:value="filterType" :options="typeOptions"
               placeholder="Тип" multiple clearable size="small" style="min-width:160px" />
      <NSelect v-model:value="filterAssignee" :options="userOptions"
               placeholder="Исполнитель" clearable size="small" style="min-width:160px" />
    </div>

    <!-- Board -->
    <div class="flex gap-3 overflow-x-auto pb-2" style="min-height: 480px">
      <div
        v-for="col in columns"
        :key="col.key"
        class="flex flex-col rounded-xl border border-edge bg-panel/40 p-3 transition-all"
        :class="{ 'drop-active': dropTarget === col.key }"
        style="min-width: 210px; flex: 1"
        @dragover.prevent
        @dragenter.prevent="onDragEnter(col.key)"
        @dragleave="onDragLeave"
        @drop="onDrop(col.key)"
      >
        <!-- Column header -->
        <div class="flex items-center gap-2 mb-3">
          <span class="w-2 h-2 rounded-full flex-shrink-0" :style="{ background: col.dot }" />
          <span class="text-xs font-medium text-slate-300">{{ col.label }}</span>
          <span class="ml-auto text-[10px] text-slate-500 bg-ink rounded px-1.5 py-0.5">
            {{ colTasks(col.key).length }}
          </span>
        </div>

        <!-- Cards -->
        <div class="flex flex-col gap-2 flex-1">
          <!-- Empty drop zone -->
          <div v-if="!colTasks(col.key).length"
               class="grid place-items-center rounded-lg border border-dashed border-edge py-6 text-xs text-slate-600 flex-1">
            drop here
          </div>

          <div
            v-for="task in colTasks(col.key)"
            :key="task.id"
            class="rounded-lg border bg-ink p-3 cursor-grab active:cursor-grabbing transition-colors"
            :class="isBlocked(task)
              ? 'border-red-500/60 hover:border-red-500/80'
              : 'border-edge hover:border-slate-500'"
            draggable="true"
            @dragstart="onDragStart(task.id)"
          >
            <p class="text-sm font-medium text-slate-200 mb-2 leading-tight">
              {{ task.title }}
            </p>
            <div class="flex items-center justify-between">
              <NTag size="tiny" :bordered="false"
                    :style="{ background: typeColors[task.type] + '22', color: typeColors[task.type], fontSize: '10px' }">
                {{ task.type }}
              </NTag>
              <span v-if="getUser(task.assigneeId)" class="text-[10px] text-slate-500">
                {{ getUser(task.assigneeId)?.firstName }}
              </span>
            </div>
            <div v-if="task.estimatedHours" class="mt-2">
              <div class="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>{{ task.actualHours ?? 0 }}h / {{ task.estimatedHours }}h</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-edge">
                <div class="h-full rounded-full bg-sky-400 transition-all"
                     :style="{ width: Math.min(100, ((task.actualHours ?? 0) / task.estimatedHours) * 100) + '%' }" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>
