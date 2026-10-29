<script setup lang="ts">
import {
  Package,
  Edit,
  ShoppingCart,
  Receipt,
  Copy,
  RefreshCw,
  DollarSign,
  Archive,
  Calendar,
} from '@lucide/vue';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  icon: any;
  iconColor: string;
}

const props = withDefaults(
  defineProps<{
    events?: TimelineEvent[];
  }>(),
  {
    events: () => [],
  },
);

const iconMap: Record<string, any> = {
  created: Package,
  purchase: Receipt,
  sale: ShoppingCart,
  adjustment: RefreshCw,
  transfer: Copy,
  price_update: DollarSign,
  edit: Edit,
  archive: Archive,
};

const colorMap: Record<string, string> = {
  created: 'text-blue-600 dark:text-blue-400',
  purchase: 'text-green-600 dark:text-green-400',
  sale: 'text-emerald-600 dark:text-emerald-400',
  adjustment: 'text-amber-600 dark:text-amber-400',
  transfer: 'text-purple-600 dark:text-purple-400',
  price_update: 'text-indigo-600 dark:text-indigo-400',
  edit: 'text-gray-600 dark:text-gray-400',
  archive: 'text-red-600 dark:text-red-400',
};
</script>

<template>
  <Card class="border border-border">
    <CardContent class="pt-6">
      <h3 class="text-lg font-medium mb-4">Activity Timeline</h3>

      <div
        v-if="events && events.length > 0"
        class="space-y-4"
      >
        <div
          v-for="event in events"
          :key="event.id"
          class="flex gap-3"
        >
          <div class="flex-shrink-0">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center bg-muted/30"
            >
              <component
                :is="event.icon || iconMap[event.type] || Calendar"
                class="w-4 h-4"
                :class="event.iconColor || colorMap[event.type]"
              />
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <p class="font-medium text-sm">{{ event.title }}</p>
              <Badge variant="outline" class="text-xs">
                {{ event.date }}
              </Badge>
            </div>
            <p class="text-sm text-muted-foreground mt-0.5">
              {{ event.description }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-else
        class="text-center py-8"
      >
        <Package class="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <h4 class="text-sm font-medium text-muted-foreground">
          No activity yet
        </h4>
        <p class="text-xs text-muted-foreground/70 mt-1">
          Timeline events will appear here as they occur.
        </p>
      </div>
    </CardContent>
  </Card>
</template>
