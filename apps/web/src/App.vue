<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import Sonner from '@/components/ui/sonner/Sonner.vue';
import CommandPalette from '@/components/CommandPalette.vue';

const auth = useAuthStore();
const theme = useThemeStore();
onMounted(() => {
  auth.loadFromStorage();
  theme.loadTheme();
});
</script>

<template>
  <CommandPalette />
  <RouterView />
  <Sonner
    :theme="theme.theme.darkMode ? 'dark' : 'light'"
    position="bottom-right"
    :close-button="true"
  />
</template>
