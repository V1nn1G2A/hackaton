<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NSpin, NAlert, NEmpty, NModal, NForm, NFormItem, NInput } from 'naive-ui'
import AppLayout from '@/components/Layout/AppLayout.vue'
import { useProjectsStore } from '@/stores/projects.store'

const router = useRouter()
const store = useProjectsStore()

const showModal = ref(false)
const newProject = ref({ name: '', description: '' })
const submitting = ref(false)

onMounted(() => store.fetchAll())

async function createProject() {
  if (!newProject.value.name.trim()) return
  submitting.value = true
  try {
    await store.create({ ...newProject.value })
    showModal.value = false
    newProject.value = { name: '', description: '' }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppLayout>
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1 class="text-xl font-semibold text-slate-200">Проекты</h1>
        <p class="text-xs text-slate-500 mt-0.5">Все ваши проекты</p>
      </div>
      <NButton type="primary" size="small" @click="showModal = true">+ Создать проект</NButton>
    </div>

    <NSpin v-if="store.loading" class="flex justify-center py-20" />
    <NAlert v-else-if="store.error" type="error" :title="store.error" />
    <NEmpty v-else-if="!store.projects.length"
            description="Нет проектов"
            class="py-20" />

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="p in store.projects"
        :key="p.id"
        class="rounded-xl border border-edge bg-panel/50 p-4 cursor-pointer transition-colors hover:border-slate-500"
        @click="router.push(`/projects/${p.id}`)"
      >
        <div class="flex items-start justify-between mb-2">
          <h3 class="text-sm font-medium text-slate-200">{{ p.name }}</h3>
          <span class="text-[10px] text-slate-500 bg-ink px-2 py-0.5 rounded-md">
            {{ new Date(p.createdAt).toLocaleDateString('ru') }}
          </span>
        </div>
        <p class="text-xs text-slate-400 line-clamp-2">
          {{ p.description ?? 'Без описания' }}
        </p>
        <div class="mt-3 pt-3 border-t border-edge flex items-center justify-between">
          <span class="text-[10px] text-slate-500">ID: {{ p.id }}</span>
          <span class="text-xs text-primary font-medium">Открыть →</span>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <NModal v-model:show="showModal" preset="card" title="Новый проект" style="max-width: 440px">
      <NForm label-placement="top">
        <NFormItem label="Название" required>
          <NInput v-model:value="newProject.name" placeholder="Название проекта"
                  @keyup.enter="createProject" />
        </NFormItem>
        <NFormItem label="Описание">
          <NInput v-model:value="newProject.description" type="textarea"
                  :rows="3" placeholder="Краткое описание" />
        </NFormItem>
        <div class="flex gap-2 justify-end">
          <NButton size="small" @click="showModal = false">Отмена</NButton>
          <NButton type="primary" size="small" :loading="submitting" @click="createProject">
            Создать
          </NButton>
        </div>
      </NForm>
    </NModal>
  </AppLayout>
</template>
