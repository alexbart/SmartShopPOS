<script setup lang="ts">
import { TrendingUp, Receipt, RotateCw, Users } from '@lucide/vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSkeleton from '@/components/business/LoadingSkeleton.vue';
import StatusBadge from '@/components/business/StatusBadge.vue';

interface RelatedItem {
  id: string;
  title: string;
  subtitle?: string;
  amount?: number;
  date?: string;
  status?: string;
}

const props = defineProps<{
  title: string;
  icon?: any;
  items?: RelatedItem[];
  loading?: boolean;
  onViewAll?: () => void;
  emptyMessage?: string;
}>();

const icons: Record<string, any> = {
  sales: TrendingUp,
  purchases: Receipt,
  movements: RotateCw,
  suppliers: Users,
};
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <CardTitle class="text-sm font-medium flex items-center gap-2">
        <component :is="icon ?? icons[title.toLowerCase()] ?? TrendingUp" class="w-4 h-4" />
        {{ title }}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="loading" class="space-y-2">
        <LoadingSkeleton :rows="3" />
      </div>

      <div v-else-if="!items || items.length === 0">
        <p class="text-sm text-muted-foreground">
          {{ emptyMessage ?? `No ${title.toLowerCase()} found` }}
        </p>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="item in items"
          :key="item.id"
          class="flex items-center justify-between py-1"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ item.title }}</p>
            <p v-if="item.subtitle" class="text-xs text-muted-foreground truncate">
              {{ item.subtitle }}
            </p>
            <p v-if="item.date" class="text-xs text-muted-foreground/70">
              {{ item.date }}
            </p>
          </div>
          <div v-if="item.amount" class="text-sm font-medium font-mono">
            {{ item.amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' }) }}
          </div>
          <StatusBadge v-else-if="item.status" :status="item.status" />
        </div>

        <button
          v-if="onViewAll"
          @click="onViewAll"
          class="text-xs text-primary hover:underline pt-1"
        >
          View all
        </button>
      </div>
    </CardContent>
  </Card>
</template>
