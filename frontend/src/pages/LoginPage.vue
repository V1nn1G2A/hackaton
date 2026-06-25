<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NForm, NFormItem, NInput, NButton, NAlert } from 'naive-ui'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const formRef = ref()

const rules = {
  email: [
    { required: true, message: 'Введите email', trigger: 'blur' },
    { type: 'email' as const, message: 'Некорректный email', trigger: 'blur' },
  ],
  password: [{ required: true, min: 6, message: 'Минимум 6 символов', trigger: 'blur' }],
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    await auth.login(email.value, password.value)
    router.push((route.query.redirect as string) || '/projects')
  } catch { /* error в auth.error */ }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-6" style="background: #0c111c">
    <div class="w-full max-w-sm">

      <!-- Logo -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center justify-center rounded-xl mb-3"
             style="width:44px;height:44px;background:#4f7cff">
          <span class="text-white font-bold text-sm">TD</span>
        </div>
        <h1 class="text-xl font-semibold text-slate-200">TeamDash</h1>
        <p class="text-xs text-slate-500 mt-1">Аналитика для тимлидов и менеджеров</p>
      </div>

      <!-- Card -->
      <div class="rounded-xl border border-edge bg-panel/50 p-6">
        <h2 class="text-sm font-medium text-slate-300 mb-5">Войти в аккаунт</h2>

        <NAlert v-if="auth.error" type="error" :title="auth.error" class="mb-4" />

        <NForm ref="formRef" :model="{ email, password }" :rules="rules" label-placement="top">
          <NFormItem label="Email" path="email">
            <NInput v-model:value="email" type="text" placeholder="you@company.com"
                    @keyup.enter="handleSubmit" />
          </NFormItem>
          <NFormItem label="Пароль" path="password">
            <NInput v-model:value="password" type="password" placeholder="••••••••"
                    show-password-on="click" @keyup.enter="handleSubmit" />
          </NFormItem>
          <NButton type="primary" block :loading="auth.loading" @click="handleSubmit">
            Войти
          </NButton>
        </NForm>

        <div class="mt-4 text-center">
          <span class="text-xs text-slate-500">Нет аккаунта? </span>
          <NButton text size="tiny" @click="router.push('/register')"
                   style="color:#4f7cff; font-size:12px">
            Зарегистрироваться
          </NButton>
        </div>
      </div>

      <!-- Demo hint -->
      <p class="mt-4 text-center text-[11px] text-slate-600">
        Демо: <span class="text-slate-500">admin@team.ru</span> / любой пароль
      </p>
    </div>
  </div>
</template>
