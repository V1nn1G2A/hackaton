<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'

defineProps<{ title?: string }>()
</script>

<template>
  <div class="flex min-h-screen" style="background: #0c111c">
    <AppSidebar />
    <div class="flex-1 min-w-0 overflow-y-auto">
      <main class="mx-auto w-full max-w-7xl p-5">
        <slot />
      </main>
    </div>
  </div>
</template>
