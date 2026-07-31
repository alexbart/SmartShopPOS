<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const form = ref({
  organizationName: '',
  ownerFirstName: '',
  ownerLastName: '',
  ownerEmail: '',
  ownerPhone: '',
  password: '',
});
const loading = ref(false);
const error = ref('');

async function handleRegister() {
  loading.value = true;
  error.value = '';
  try {
    await auth.register(form.value);
    router.push('/');
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Registration failed';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-lg">
      <div class="card p-8">
        <div class="text-center mb-6">
          <h1 class="text-3xl font-bold text-primary-600">SmartShopPOS</h1>
          <p class="text-sm text-gray-600 mt-1">Create your organization</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <input v-model="form.organizationName" placeholder="Organization Name" class="input" required />
            <input v-model="form.password" type="password" placeholder="Password" class="input" required />
            <input v-model="form.ownerFirstName" placeholder="Owner First Name" class="input" required />
            <input v-model="form.ownerLastName" placeholder="Owner Last Name" class="input" required />
            <input v-model="form.ownerEmail" type="email" placeholder="Owner Email" class="input" required />
            <input v-model="form.ownerPhone" placeholder="Owner Phone" class="input" required />
          </div>

          <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>

          <button type="submit" :disabled="loading" class="w-full btn btn-primary">
            {{ loading ? 'Creating...' : 'Create Organization' }}
          </button>
        </form>

        <div class="text-center mt-4">
          <button @click="router.push('/login')" class="text-sm text-primary-600 hover:underline">
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
