<script setup lang="ts">
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface ActionButton {
  label: string;
  icon?: any;
  variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive';
  loading?: boolean;
  onClick: () => void;
}

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    workspaceIcon?: any;
    breadcrumbs?: Breadcrumb[];
    actionButton?: ActionButton;
  }>(),
  {
    breadcrumbs: () => [],
    actionButton: undefined,
  },
);
</script>

<template>
  <div class="border-b bg-card px-4 sm:px-6 py-4">
    <div v-if="breadcrumbs && breadcrumbs.length" class="mb-3">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem v-for="(crumb, i) in breadcrumbs" :key="i">
            <template v-if="crumb.href && i < breadcrumbs.length - 1">
              <RouterLink :to="crumb.href" class="breadcrumb-link">
                {{ crumb.label }}
              </RouterLink>
            </template>
            <template v-else>
              <BreadcrumbPage>{{ crumb.label }}</BreadcrumbPage>
            </template>
            <BreadcrumbSeparator v-if="i < breadcrumbs.length - 1" />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>

    <div class="flex items-start justify-between gap-4">
      <div class="flex items-center gap-3">
        <component
          v-if="workspaceIcon"
          :is="workspaceIcon"
          class="h-6 w-6 text-primary"
        />
        <div>
          <h1 class="text-2xl font-bold">{{ title }}</h1>
          <p v-if="description" class="text-sm text-muted-foreground mt-0.5">
            {{ description }}
          </p>
        </div>
      </div>

      <div v-if="actionButton" class="flex items-center gap-2">
        <Button
          :variant="actionButton.variant || 'default'"
          :disabled="actionButton.loading"
          @click="actionButton.onClick"
          class="touch-target"
        >
          <component
            v-if="actionButton.icon"
            :is="actionButton.icon"
            class="h-4 w-4 mr-2"
          />
          {{ actionButton.loading ? 'Saving...' : actionButton.label }}
        </Button>
      </div>
    </div>
  </div>
</template>
