<script setup lang="ts">
import { ArrowUpRight, Lightbulb } from '@lucide/vue';
import type { GuideSection } from '../content/guide-types';

defineProps<{ section: GuideSection; index: number }>();
</script>

<template>
  <section :id="section.id" class="scroll-mt-6 rounded-xl border bg-card p-5">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 class="flex items-baseline gap-2 text-lg font-semibold">
          <span class="font-mono text-xs text-muted-foreground">{{
            String(index).padStart(2, '0')
          }}</span>
          <span>{{ section.title }}</span>
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ section.summary }}</p>
      </div>

      <RouterLink
        v-if="section.path"
        :to="section.path"
        class="inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-primary"
      >
        Open screen
        <ArrowUpRight class="h-3.5 w-3.5" />
      </RouterLink>
    </div>

    <ol class="mt-4 space-y-3.5">
      <li v-for="(step, stepIndex) in section.steps" :key="step.title" class="flex gap-3">
        <span
          class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
        >
          {{ stepIndex + 1 }}
        </span>
        <div class="min-w-0">
          <p class="text-sm font-medium">{{ step.title }}</p>
          <p class="mt-0.5 text-sm leading-relaxed text-muted-foreground">{{ step.body }}</p>
          <p v-if="step.tip" class="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Lightbulb class="mt-px h-3.5 w-3.5 shrink-0" />
            <span>{{ step.tip }}</span>
          </p>
        </div>
      </li>
    </ol>

    <div v-if="section.code" class="mt-4">
      <p class="mb-1.5 font-mono text-xs uppercase tracking-wide text-muted-foreground">
        {{ section.code.label }}
      </p>
      <pre
        class="overflow-x-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed"
      ><code>{{ section.code.code }}</code></pre>
    </div>

    <ul v-if="section.notes?.length" class="mt-4 space-y-1.5 border-t pt-3">
      <li
        v-for="note in section.notes"
        :key="note"
        class="flex gap-1.5 text-xs leading-relaxed text-muted-foreground"
      >
        <span class="select-none">·</span>
        <span>{{ note }}</span>
      </li>
    </ul>
  </section>
</template>
