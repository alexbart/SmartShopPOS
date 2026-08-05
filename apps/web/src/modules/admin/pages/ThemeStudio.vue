<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Palette, Upload, Save } from '@lucide/vue';
import { useThemeStore } from '@/stores/theme';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';

const theme = useThemeStore();

const form = ref({
  businessName: theme.theme?.businessName || 'SmartShopPOS',
  primaryColor: theme.theme?.primaryColor || '#3b82f6',
  secondaryColor: theme.theme?.secondaryColor || '#64748a',
  accentColor: theme.theme?.accentColor || '#10b981',
  sidebarStyle: theme.theme?.sidebarStyle || 'full',
  roundedCorners: theme.theme?.roundedCorners ?? true,
  cardRadius: theme.theme?.cardRadius || '0.5rem',
  fontPrimary: theme.theme?.fontPrimary || 'Inter',
});

const primaryPresets = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#06b6d4'];
const secondaryPresets = ['#64748a', '#94a3b8', '#cbd5e1', '#94a3b8', '#cbd5e1', '#94a3b8'];

watch(primaryColor, (val) => {
  document.documentElement.style.setProperty('--color-primary', hexToHsl(val));
});

const previewStyle = computed(() => ({
  '--card-radius': form.value.cardRadius,
} as any));

function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const s = l === 0 || l === 1 ? 0 : (max - min) / (2 - max - min);
  const h =
    l === 0
      ? 0
      : max === r
        ? (g - b) / (max - min)
        : max === g
          ? 2 + (b - r) / (max - min)
          : 4 + (r - g) / (max - min);
  return `${Math.round(h * 120)} 40% ${Math.round(l * 100)}%`;
}

function handleSave() {
  theme.setTheme({
    businessName: form.value.businessName,
    primaryColor: form.value.primaryColor,
    secondaryColor: form.value.secondaryColor,
    accentColor: form.value.accentColor,
    sidebarStyle: form.value.sidebarStyle,
    roundedCorners: form.value.roundedCorners,
    cardRadius: form.value.cardRadius,
    fontPrimary: form.value.fontPrimary,
  });
  theme.loadTheme();
}

function primaryColor() {
  return form.value.primaryColor;
}
</script>

<template>
  <WorkspaceShell
    workspace-title="Theme Studio"
    workspace-description="Customize your brands appearance"
  >
    <div class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-4 space-y-4">
          <h3 class="font-medium flex items-center gap-2">
            <Palette class="w-4 h-4" />
            Branding
          </h3>

          <div>
            <label class="block text-sm font-medium mb-1">Business Name</label>
            <input v-model="form.businessName" type="text" class="input w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Primary Color</label>
            <div class="flex items-center gap-2">
              <input v-model="form.primaryColor" type="color" class="w-10 h-8 p-0 border border-border rounded cursor-pointer" />
              <input v-model="form.primaryColor" type="text" class="input flex-1" />
            </div>
            <div class="flex gap-1 mt-2">
              <button
                v-for="c in primaryPresets"
                :key="c"
                @click="form.primaryColor = c"
                class="w-6 h-6 rounded border border-border cursor-pointer"
                :style="{ backgroundColor: c }"
              ></button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Accent Color</label>
            <input v-model="form.accentColor" type="color" class="w-10 h-8 p-0 border border-border rounded cursor-pointer" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Sidebar Style</label>
            <select v-model="form.sidebarStyle" class="input w-full">
              <option value="full">Full Sidebar</option>
              <option value="compact">Compact</option>
              <option value="icons">Icons Only</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Card Radius</label>
            <select v-model="form.cardRadius" class="input w-full">
              <option value="0rem">None</option>
              <option value="0.25rem">Small</option>
              <option value="0.5rem">Medium</option>
              <option value="1rem">Large</option>
              <option value="1.5rem">XL</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <input v-model="form.roundedCorners" type="checkbox" id="rounded" />
            <label for="rounded" class="text-sm">Rounded corners</label>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Font</label>
            <input v-model="form.fontPrimary" type="text" class="input w-full" />
          </div>

          <button @click="handleSave" class="btn btn-primary w-full touch-target">
            <Save class="w-4 h-4 mr-2" />
            Save Theme
          </button>
        </div>

        <div class="card p-4" :style="previewStyle">
          <h3 class="font-medium mb-3">Live Preview</h3>
          <div class="space-y-3">
            <div class="card p-3">
              <div class="font-bold">{{ form.businessName }}</div>
              <div class="text-sm text-muted-foreground">Tagline goes here</div>
            </div>
            <div class="card p-3">
              <button class="btn btn-primary w-full">Primary Button</button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="card p-2">
                <div class="h-4 bg-muted/30 rounded"></div>
              </div>
              <div class="card p-2">
                <div class="h-4 bg-muted/30 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-4">
        <label class="block text-sm font-medium mb-2">Logo Upload</label>
        <div class="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <Upload class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">
            Drag & drop your logo or click to upload
          </p>
          <input type="file" class="hidden" id="theme-logo-upload" accept="image/*" />
          <label for="theme-logo-upload" class="text-primary text-sm cursor-pointer">Browse files</label>
        </div>
      </div>
    </div>
  </WorkspaceShell>
</template>
