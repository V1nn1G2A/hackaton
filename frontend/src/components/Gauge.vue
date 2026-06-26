<script setup lang="ts">
import { computed } from 'vue'
import { NProgress } from 'naive-ui'

const props = withDefaults(
  defineProps<{
    percentage: number
    label?: string
    sublabel?: string
    color?: string
    size?: number
    danger?: boolean
  }>(),
  { size: 150 },
)

const resolvedColor = computed(() => {
  if (props.danger) return '#f87171'
  if (props.color) return props.color
  if (props.percentage >= 90) return '#ef4444'
  if (props.percentage >= 70) return '#f59e0b'
  if (props.percentage >= 40) return '#34d399'
  return '#60a5fa'
})
</script>

<template>
  <div style="display: flex; flex-direction: column; align-items: center;">
    <NProgress
      type="dashboard"
      :percentage="Math.min(100, Math.max(0, percentage))"
      :color="resolvedColor"
      :stroke-width="9"
      :offset-degree="0"
      :style="{ width: size + 'px' }"
    >
      <div style="text-align: center;">
        <div style="font-size: 20px; font-weight: 600;" :style="{ color: resolvedColor }">
          {{ Math.round(percentage) }}%
        </div>
        <div v-if="sublabel" style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
          {{ sublabel }}
        </div>
      </div>
    </NProgress>
    <div v-if="label" style="margin-top: 4px; font-size: 12px; font-weight: 500; color: #cbd5e1; text-align: center;">
      {{ label }}
    </div>
  </div>
</template>
