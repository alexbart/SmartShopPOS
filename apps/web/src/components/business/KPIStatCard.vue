<script setup lang="ts">
defineProps<{
  title: string;
  value: number | string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  currency?: boolean;
}>();
</script>

<template>
  <div class="card p-4">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-muted-foreground">{{ title }}</p>
        <p class="text-2xl font-bold text-card-foreground mt-1">
          <span v-if="currency">KES </span>
          {{ value }}
        </p>
        <p v-if="subtitle" class="text-xs text-muted-foreground mt-1">{{ subtitle }}</p>
      </div>

      <div
        v-if="icon"
        class="w-10 h-10 rounded-lg flex items-center justify-center"
        :class="{
          'bg-primary/10 text-primary': trend === 'up',
          'bg-red-100 text-red-600': trend === 'down',
          'bg-gray-100 text-gray-600': trend === 'neutral' || !trend,
        }"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
        </svg>
      </div>
    </div>

    <div
      v-if="trend"
      class="flex items-center gap-1 mt-2 text-xs"
      :class="{
        'text-green-600': trend === 'up',
        'text-red-600': trend === 'down',
      }"
    >
      <svg
        v-if="trend === 'up'"
        class="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 19V5m7 7l-7 7-7-7" />
      </svg>
      <svg
        v-else-if="trend === 'down'"
        class="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 5v14m0 0l7-7m-7 7l-7-7" />
      </svg>
      <span>{{ trend === 'up' ? 'Increased' : 'Decreased' }}</span>
    </div>
  </div>
</template>
