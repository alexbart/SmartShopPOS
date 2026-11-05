<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BookOpen, Terminal } from '@lucide/vue';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import { useAuthStore } from '@/stores/auth';
import GuideSection from './components/GuideSection.vue';
import { devGuide } from './content/dev-guide';
import type { GuideAudience } from './content/guide-types';
import { userGuide } from './content/user-guide';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

/** Platform commands have no place in front of a cashier. */
const canReadDevGuide = computed(() => {
  if (!auth.rolesLoaded) return false;
  const allowed = ['super_admin', 'owner', 'administrator', 'manager'];
  return auth.roles.some((role) => allowed.includes(role.toLowerCase()));
});

function audienceFromRoute(): GuideAudience {
  return route.query.tab === 'dev' && canReadDevGuide.value ? 'dev' : 'user';
}

const audience = ref<GuideAudience>(audienceFromRoute());

const tabs = computed(() => {
  const list = [{ label: 'User Guide', value: 'user', icon: BookOpen }];
  if (canReadDevGuide.value) list.push({ label: 'Dev Guide', value: 'dev', icon: Terminal });
  return list;
});

const guide = computed(() => (audience.value === 'dev' ? devGuide : userGuide));

/** Flattens chapters while numbering sections continuously across chapters. */
const numberedChapters = computed(() => {
  let index = 0;
  return guide.value.chapters.map((chapter) => ({
    ...chapter,
    sections: chapter.sections.map((section) => ({ section, index: ++index })),
  }));
});

function selectAudience(value: string) {
  if (value === audience.value) return;
  audience.value = value === 'dev' && canReadDevGuide.value ? 'dev' : 'user';
}

watch(audience, (value) => {
  const query = { ...route.query };
  if (value === 'dev') query.tab = 'dev';
  else delete query.tab;
  void router.replace({ query });
});

watch(
  () => route.query.tab,
  () => {
    audience.value = audienceFromRoute();
  },
);

// Roles load after the first render, so a permitted user may gain the tab late.
watch(canReadDevGuide, (allowed) => {
  if (!allowed && audience.value === 'dev') audience.value = 'user';
});
</script>

<template>
  <WorkspaceShell
    workspace-title="Help & Guide"
    workspace-description="How to run the shop, and how to run the code"
    :workspace-icon="BookOpen"
    :breadcrumbs="[{ label: 'Help & Guide' }]"
    :tabs="tabs"
    :active-tab="audience"
    :show-toolbar="false"
    @update:activeTab="selectAudience"
  >
    <div class="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside class="hidden lg:block">
        <nav class="sticky top-4 space-y-4">
          <div v-for="chapter in guide.chapters" :key="chapter.id" class="space-y-0.5">
            <p class="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {{ chapter.title }}
            </p>
            <a
              v-for="section in chapter.sections"
              :key="section.id"
              :href="`#${section.id}`"
              class="block rounded-md px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {{ section.title }}
            </a>
          </div>
        </nav>
      </aside>

      <div class="space-y-4">
        <p class="rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
          {{ guide.description }}
        </p>

        <template v-for="chapter in numberedChapters" :key="chapter.id">
          <h2 class="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {{ chapter.title }}
          </h2>
          <GuideSection
            v-for="entry in chapter.sections"
            :key="entry.section.id"
            :section="entry.section"
            :index="entry.index"
          />
        </template>
      </div>
    </div>
  </WorkspaceShell>
</template>
