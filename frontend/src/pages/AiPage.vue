<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NSpin, NAlert } from 'naive-ui'
import { apiClient } from '@/api/client'

const route = useRoute()
const sprintId = route.params.sprintId as string

type State = 'idle' | 'loading' | 'success' | 'error'

const summaryState = ref<State>('idle')
const risksState = ref<State>('idle')
const summaryText = ref('')
const risksText = ref('')
const summaryError = ref('')
const risksError = ref('')

async function fetchSummary() {
  summaryState.value = 'loading'
  summaryError.value = ''
  try {
    const { data } = await apiClient.post<{ result: string }>(`/ai/sprint/${sprintId}/summary`)
    summaryText.value = data.result
    summaryState.value = 'success'
  } catch (e: any) {
    summaryError.value = e.response?.data?.message ?? 'Ошибка генерации'
    summaryState.value = 'error'
  }
}

async function fetchRisks() {
  risksState.value = 'loading'
  risksError.value = ''
  try {
    const { data } = await apiClient.post<{ result: string }>(`/ai/sprint/${sprintId}/risks`)
    risksText.value = data.result
    risksState.value = 'success'
  } catch (e: any) {
    risksError.value = e.response?.data?.message ?? 'Ошибка анализа'
    risksState.value = 'error'
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-slate-200 mb-1">AI Анализ</h2>
    <p class="text-xs text-slate-500 mb-5">Claude анализирует данные текущего спринта</p>

    <div class="grid gap-4 sm:grid-cols-2">

      <!-- Summary -->
      <div class="rounded-xl border border-edge bg-panel/50 p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-sm font-medium text-slate-300">✦ Саммари спринта</p>
            <p class="text-xs text-slate-500 mt-0.5">Прогресс и ключевые события</p>
          </div>
          <NButton type="primary" size="small" :loading="summaryState === 'loading'" @click="fetchSummary">
            Сгенерировать
          </NButton>
        </div>

        <NSpin v-if="summaryState === 'loading'" />
        <NAlert v-else-if="summaryState === 'error'" type="error" :title="summaryError" />
        <div v-else-if="summaryState === 'success'"
             class="rounded-lg bg-ink border border-edge p-3 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {{ summaryText }}
        </div>
        <div v-else
             class="grid place-items-center rounded-lg border border-dashed border-edge py-8 text-xs text-slate-600">
          Нажмите кнопку для генерации
        </div>
      </div>

      <!-- Risks -->
      <div class="rounded-xl border border-edge bg-panel/50 p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-sm font-medium text-slate-300">⚠ Анализ рисков</p>
            <p class="text-xs text-slate-500 mt-0.5">Узкие места и блокеры</p>
          </div>
          <NButton size="small" :loading="risksState === 'loading'" @click="fetchRisks"
                   style="color: #fbbf24; border-color: #fbbf2440">
            Анализировать
          </NButton>
        </div>

        <NSpin v-if="risksState === 'loading'" />
        <NAlert v-else-if="risksState === 'error'" type="error" :title="risksError" />
        <div v-else-if="risksState === 'success'"
             class="rounded-lg bg-ink border border-edge p-3 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {{ risksText }}
        </div>
        <div v-else
             class="grid place-items-center rounded-lg border border-dashed border-edge py-8 text-xs text-slate-600">
          Нажмите кнопку для анализа
        </div>
      </div>

    </div>
  </div>
</template>
