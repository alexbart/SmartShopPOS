<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { notification } from '@/stores/notification';

const router = useRouter();
const auth = useAuthStore();

const form = ref({
  email: '',
  password: '',
  organizationCode: '',
});
const loading = ref(false);
const error = ref('');

async function handleLogin() {
  loading.value = true;
  error.value = '';
  try {
    await auth.login(form.value.email, form.value.password, form.value.organizationCode);
    notification.success('Login successful');
    router.push('/');
  } catch (e: any) {
    error.value = e.response?.data?.error?.message || 'Login failed';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md">
      <div class="card p-8">
        <div class="text-center mb-6">
          <h1 class="text-3xl font-bold text-primary-600">SmartShopPOS</h1>
          <p class="text-sm text-gray-600 mt-1">Sign in to your account</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <input v-model="form.organizationCode" type="text" placeholder="Organization Code" class="input" required />
          </div>
          <div>
            <input v-model="form.email" type="email" placeholder="Email" class="input" required />
          </div>
          <div>
            <input v-model="form.password" type="password" placeholder="Password" class="input" required />
          </div>

          <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>

          <button type="submit" :disabled="loading" class="w-full btn btn-primary">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="text-center mt-4">
          <button @click="router.push('/register')" class="text-sm text-primary-600 hover:underline">
            Need an account? Register
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
