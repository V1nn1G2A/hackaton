<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NMenu, NAvatar, NText, NButton, NDivider } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { useAuthStore } from '@/stores/auth.store'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const menuOptions: MenuOption[] = [
  { label: 'Проекты', key: '/projects', icon: () => h('span', { class: 'text-slate-400 text-sm' }, '◫') },
]

const activeKey = computed(() => '/' + route.path.split('/')[1])

const initials = computed(() => {
  if (!auth.user) return '?'
  return `${auth.user.firstName[0]}${auth.user.lastName[0]}`.toUpperCase()
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="flex flex-col border-r border-edge bg-panel/60 backdrop-blur"
         style="width: 220px; min-height: 100vh; flex-shrink: 0">

    <!-- Logo -->
    <div class="flex items-center gap-2.5 px-4 py-5 border-b border-edge">
      <div class="flex items-center justify-center rounded-lg bg-primary text-white font-bold text-xs"
           style="width: 30px; height: 30px">TD</div>
      <span class="text-sm font-semibold text-slate-200">TeamDash</span>
    </div>

    <!-- Nav -->
    <div class="flex-1 py-2">
      <NMenu
        :options="menuOptions"
        :value="activeKey"
        :indent="12"
        @update:value="(k) => router.push(k as string)"
      />
    </div>

    <!-- User footer -->
    <div class="px-3 pb-4">
      <NDivider style="margin: 0 0 12px" />
      <div class="flex items-center gap-2">
        <NAvatar round size="small" :style="{ background: '#4f7cff', fontSize: '11px' }">
          {{ initials }}
        </NAvatar>
        <div class="flex-1 min-w-0">
          <NText class="block text-xs font-medium text-slate-200 truncate">
            {{ auth.user?.firstName }} {{ auth.user?.lastName }}
          </NText>
          <NText class="block text-[10px] text-slate-500 uppercase">
            {{ auth.user?.role }}
          </NText>
        </div>
        <NButton quaternary circle size="small" @click="logout"
                 style="color: #64748b">
          <template #icon><span style="font-size:12px">✕</span></template>
        </NButton>
      </div>
    </div>
  </aside>
</template>
