import { computed } from 'vue';

export function useGreeting() {
  const hour = computed(() => new Date().getHours());

  const greeting = computed(() => {
    const h = hour.value;
    if (h >= 5 && h < 12) return { text: 'Good Morning', icon: '☀' };
    if (h >= 12 && h < 18) return { text: 'Good Afternoon', icon: '🌤' };
    return { text: 'Good Evening', icon: '🌙' };
  });

  return { greeting };
}
