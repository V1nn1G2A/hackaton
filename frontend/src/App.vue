<script setup lang="ts">
import { onMounted } from 'vue'
import { NConfigProvider, NMessageProvider, darkTheme } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const auth = useAuthStore()
onMounted(() => auth.init())

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#4f7cff',
    primaryColorHover: '#6b91ff',
    primaryColorPressed: '#3a63d6',
    primaryColorSuppl: '#4f7cff',
    borderRadius: '10px',
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    bodyColor: '#0c111c',
    cardColor: '#172033',
    modalColor: '#172033',
    popoverColor: '#172033',
    tableColor: '#101622',
    tableHeaderColor: '#172033',
    dividerColor: '#243049',
    borderColor: '#243049',
    inputColor: '#101622',
    inputColorDisabled: '#101622',
  },
  DataTable: {
    thColor: '#172033',
    tdColor: '#101622',
    tdColorHover: '#172033',
    borderColor: '#243049',
  },
  Card: {
    color: '#172033',
    borderColor: '#243049',
  },
  Menu: {
    color: 'transparent',
    itemColorActive: 'rgba(79, 124, 255, 0.12)',
    itemColorActiveHover: 'rgba(79, 124, 255, 0.16)',
    itemTextColorActive: '#4f7cff',
    itemIconColorActive: '#4f7cff',
    itemColorHover: 'rgba(255,255,255,0.05)',
  },
  Tabs: {
    tabTextColorActiveBar: '#4f7cff',
    tabTextColorHoverBar: '#6b91ff',
    barColor: '#4f7cff',
  },
  Tag: {
    borderRadius: '6px',
  },
}
</script>

<template>
  <NConfigProvider :theme="darkTheme" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <RouterView />
    </NMessageProvider>
  </NConfigProvider>
</template>
