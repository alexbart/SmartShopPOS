<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import Toast from '@/components/Toast.vue';

const auth = useAuthStore();
const theme = useThemeStore();
onMounted(() => {
  auth.loadFromStorage();
  theme.loadTheme();
});
</script>>

<template>
  <RouterView />
  <Toast />
</template>
