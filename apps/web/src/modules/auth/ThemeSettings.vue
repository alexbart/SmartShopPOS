<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useThemeStore, type ThemeConfig } from '@/stores/theme';
import { notification } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';

const themeStore = useThemeStore();
const auth = useAuthStore();

const editableTheme = ref<ThemeConfig>({ ...themeStore.theme });

const presetColors = {
  primary: ['#2563eb', '#0d9488', '#10b981', '#ea580c', '#16a34a', '#4f46e5', '#dc2626', '#7c3aed'],
  secondary: ['#64748b', '#475569', '#6b7280', '#7c3aed', '#78350f', '#1e293b', '#dc2626', '#374151'],
  accent: ['#f59e0b', '#3b82f6', '#84cc16', '#f97316', '#22c55e', '#a855f7', '#f97316', '#fbbf24'],
};

const presets = [
  {
    name: 'Corporate',
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f59e0b',
    preview: { bg: 'bg-blue-900', card: 'bg-white', text: 'text-white' },
  },
  {
    name: 'Ocean',
    primary: '#0d9488',
    secondary: '#475569',
    accent: '#3b82f6',
    preview: { bg: 'bg-teal-900', card: 'bg-cyan-50', text: 'text-white' },
  },
  {
    name: 'Emerald',
    primary: '#10b981',
    secondary: '#6b7280',
    accent: '#84cc16',
    preview: { bg: 'bg-green-900', card: 'bg-green-50', text: 'text-white' },
  },
  {
    name: 'Sunset',
    primary: '#ea580c',
    secondary: '#7c3aed',
    accent: '#f97316',
    preview: { bg: 'bg-orange-900', card: 'bg-amber-50', text: 'text-white' },
  },
  {
    name: 'Forest',
    primary: '#16a34a',
    secondary: '#78350f',
    accent: '#22c55e',
    preview: { bg: 'bg-green-950', card: 'bg-lime-50', text: 'text-white' },
  },
  {
    name: 'Midnight',
    primary: '#4f46e5',
    secondary: '#1e293b',
    accent: '#a855f7',
    preview: { bg: 'bg-indigo-900', card: 'bg-purple-50', text: 'text-white' },
  },
  {
    name: 'Coffee',
    primary: '#7c3aed',
    secondary: '#451a03',
    accent: '#d97706',
    preview: { bg: 'bg-amber-950', card: 'bg-amber-50', text: 'text-white' },
  },
  {
    name: 'Pharmacy',
    primary: '#0284c7',
    secondary: '#171717',
    accent: '#22c55e',
    preview: { bg: 'bg-slate-900', card: 'bg-blue-50', text: 'text-white' },
  },
];

const organizationInfo = ref({
  businessName: editableTheme.value.businessName,
  tagline: '',
  supportEmail: '',
  supportPhone: '',
  website: '',
  currency: 'KES',
  timezone: 'Africa/Nairobi',
  language: 'en',
});

const brandAssets = ref({
  logo: editableTheme.value.logo,
  darkLogo: null as string | null,
  lightLogo: null as string | null,
  favicon: null as string | null,
  loginIllustration: null as string | null,
});

function applyPreset(p: typeof presets[0]) {
  editableTheme.value.primary = p.primary;
  editableTheme.value.secondary = p.secondary;
  editableTheme.value.accent = p.accent;
}

function handleImageUpload(field: keyof typeof brandAssets) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        brandAssets.value[field] = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

function updateEditableTheme(updates: Partial<ThemeConfig>) {
  editableTheme.value = { ...editableTheme.value, ...updates };
}

async function saveSettings() {
  themeStore.updateTheme(editableTheme.value);
  Object.assign(editableTheme.value, editableTheme.value);

  await themeStore.saveTheme();

  Object.assign(themeStore.theme, editableTheme.value, {
    businessName: organizationInfo.value.businessName,
  });

  notification.success('Theme saved successfully', 'Your branding has been applied');
}

function cancelSettings() {
  editableTheme.value = { ...themeStore.theme };
  notification.info('Changes discarded');
}

function resetToDefault() {
  editableTheme.value = { ...editableTheme.value, ...{
    primary: '#3b82f6',
    secondary: '#6b7280',
    accent: '#f59e0b',
    darkMode: false,
    compactMode: false,
    radius: '0.5rem',
  } };
}

const accentColorClass = computed(() => {
  const hex = editableTheme.value.primary;
  if (!hex) return 'bg-blue-500';
  return '';
});
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Branding &amp; Appearance</h1>
        <p class="text-sm text-gray-600 mt-1">Customize your organization's branding and theme</p>
      </div>
      <div class="flex gap-2">
        <button @click="cancelSettings" class="btn btn-outline">Cancel</button>
        <button @click="saveSettings" class="btn btn-primary">Save Changes</button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <div class="space-y-6">
        <div class="card p-6">
          <h2 class="font-bold text-lg mb-4">Brand Colors</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div class="flex gap-2 mb-2">
                <div class="flex gap-1 flex-wrap">
                  <button
                    v-for="c in presetColors.primary"
                    :key="c"
                    @click="updateEditableTheme({ primary: c })"
                    :class="editableTheme.primary === c ? 'ring-2 ring-offset-2 ring-gray-500' : ''"
                    :style="{ backgroundColor: c }"
                    class="w-8 h-8 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="editableTheme.primary"
                  type="color"
                  class="w-10 h-10 p-0 border rounded cursor-pointer"
                />
                <input v-model="editableTheme.primary" type="text" class="input flex-1 font-mono text-sm" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <div class="flex gap-2 mb-2">
                <div class="flex gap-1 flex-wrap">
                  <button
                    v-for="c in presetColors.secondary"
                    :key="c"
                    @click="updateEditableTheme({ secondary: c })"
                    :class="editableTheme.secondary === c ? 'ring-2 ring-offset-2 ring-gray-500' : ''"
                    :style="{ backgroundColor: c }"
                    class="w-8 h-8 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="editableTheme.secondary"
                  type="color"
                  class="w-10 h-10 p-0 border rounded cursor-pointer"
                />
                <input v-model="editableTheme.secondary" type="text" class="input flex-1 font-mono text-sm" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
              <div class="flex gap-2 mb-2">
                <div class="flex gap-1 flex-wrap">
                  <button
                    v-for="c in presetColors.accent"
                    :key="c"
                    @click="updateEditableTheme({ accent: c })"
                    :class="editableTheme.accent === c ? 'ring-2 ring-offset-2 ring-gray-500' : ''"
                    :style="{ backgroundColor: c }"
                    class="w-8 h-8 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="editableTheme.accent"
                  type="color"
                  class="w-10 h-10 p-0 border rounded cursor-pointer"
                />
                <input v-model="editableTheme.accent" type="text" class="input flex-1 font-mono text-sm" />
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="font-bold text-lg mb-4">Theme Presets</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="preset in presets"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="group p-3 border border-gray-200 rounded-lg hover:border-primary transition-colors text-left"
            >
              <div class="flex items-center gap-2 mb-2">
                <div class="flex gap-1">
                  <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: preset.primary }"></div>
                  <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: preset.secondary }"></div>
                  <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: preset.accent }"></div>
                </div>
                <span class="font-medium">{{ preset.name }}</span>
              </div>
              <div
                class="h-8 rounded group-hover:opacity-80 transition-opacity"
                :class="preset.preview.bg"
              >
                <div class="h-full rounded flex items-center px-2" :class="preset.preview.card">
                  <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: preset.primary }"></div>
                  <div class="h-3 w-16 rounded ml-1" :style="{ backgroundColor: preset.accent }"></div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="font-bold text-lg mb-4">Brand Assets</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              <button @click="handleImageUpload('logo')" class="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary">
                <svg v-if="!brandAssets.logo" class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 9a2 2 0 012-2h.5a4 4 0 014 4v5a2 2 0 002 2h5a2 2 0 000-4V9a2 2 0 012-2h2" />
                </svg>
                <img v-else :src="brandAssets.logo" alt="Logo" class="h-10 object-contain" />
              </button>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Favicon</label>
              <button @click="handleImageUpload('favicon')" class="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary">
                <svg v-if="!brandAssets.favicon" class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7" />
                </svg>
                <img v-else :src="brandAssets.favicon" alt="Favicon" class="h-10 object-contain" />
              </button>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dark Logo</label>
              <button @click="handleImageUpload('darkLogo')" class="w-full h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary">
                <svg v-if="!brandAssets.darkLogo" class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 18h.01M12 15h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <img v-else :src="brandAssets.darkLogo" alt="Dark Logo" class="h-8 object-contain" />
              </button>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Light Logo</label>
              <button @click="handleImageUpload('lightLogo')" class="w-full h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary">
                <svg v-if="!brandAssets.lightLogo" class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 18h.01M12 15h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <img v-else :src="brandAssets.lightLogo" alt="Light Logo" class="h-8 object-contain" />
              </button>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="font-bold text-lg mb-4">Organization Identity</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  v-model="organizationInfo.businessName"
                  type="text"
                  placeholder="Acme Supermarket"
                  class="input"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input v-model="organizationInfo.tagline" type="text" placeholder="Fresh & Quality" class="input" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                <input v-model="organizationInfo.supportEmail" type="email" placeholder="support@acme.com" class="input" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                <input v-model="organizationInfo.supportPhone" type="tel" placeholder="+254 700 000 000" class="input" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input v-model="organizationInfo.website" type="url" placeholder="www.acme.com" class="input" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select v-model="organizationInfo.currency" class="input">
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select v-model="organizationInfo.timezone" class="input">
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="America/New_York">America/New York (EST/EDT)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select v-model="organizationInfo.language" class="input">
                  <option value="en">English</option>
                  <option value="sw">Kiswahili</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="font-bold text-lg mb-4">Appearance</h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <label class="text-sm text-gray-700">Dark Mode</label>
              <button
                @click="updateEditableTheme({ darkMode: !editableTheme.darkMode })"
                :class="editableTheme.darkMode ? 'bg-primary' : 'bg-gray-300'"
                class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors"
              >
                <span class="absolute inset-y-0 left-1/2 h-4 w-4 -translate-x-1/2 transform text-white text-xs">
                  {{ editableTheme.darkMode ? '✓' : '' }}
                </span>
              </button>
            </div>

            <div class="flex items-center justify-between">
              <label class="text-sm text-gray-700">Compact Mode</label>
              <button
                @click="updateEditableTheme({ compactMode: !editableTheme.compactMode })"
                :class="editableTheme.compactMode ? 'bg-primary' : 'bg-gray-300'"
                class="relative inline-flex h-5 w-10 items-center rounded-full transition-colors"
              >
                <span class="absolute inset-y-0 left-1/2 h-4 w-4 -translate-x-1/2 transform text-white text-xs">
                  {{ editableTheme.compactMode ? '✓' : '' }}
                </span>
              </button>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Border Radius: {{ editableTheme.radius }}
              </label>
              <div class="flex gap-2">
                <input
                  v-model.number="editableTheme.radius"
                  type="range"
                  min="0"
                  max="0.75"
                  step="0.125"
                  class="flex-1"
                />
                <input
                  v-model="editableTheme.radius"
                  type="text"
                  class="input w-20 font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
              <select v-model="editableTheme.fontFamily" class="input">
                <option value="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">Inter (Default)</option>
                <option value="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">System UI</option>
                <option value="roboto, sans-serif">Roboto</option>
                <option value="'Fira Code', monospace">Fira Code (Monospace)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex justify-between">
          <button @click="resetToDefault" class="btn btn-ghost">Reset to Default</button>
        </div>
      </div>

      <div class="card p-6 h-fit">
        <h2 class="font-bold text-lg mb-4">Live Preview</h2>
        <div
          class="rounded-lg overflow-hidden transition-all duration-200"
          :class="editableTheme.darkMode ? 'bg-gray-900' : 'bg-gray-100'"
        >
          <div class="border-b" :class="editableTheme.darkMode ? 'border-gray-700' : 'border-gray-200'">
            <div class="flex items-center gap-3 p-4">
              <div v-if="brandAssets.logo" class="w-8 h-8">
                <img :src="brandAssets.logo" alt="Logo" class="w-full h-full object-contain" />
              </div>
              <div
                v-else
                class="w-8 h-8 rounded flex items-center justify-center"
                :class="editableTheme.darkMode ? 'bg-gray-700' : 'bg-gray-200'"
              >
                <span class="text-sm font-bold" :class="editableTheme.darkMode ? 'text-gray-300' : 'text-gray-600'">S</span>
              </div>
              <div>
                <h3 class="font-bold" :class="editableTheme.darkMode ? 'text-white' : 'text-gray-900'">
                  {{ organizationInfo.businessName }}
                </h3>
                <p class="text-xs" :class="editableTheme.darkMode ? 'text-gray-400' : 'text-gray-500'">
                  Dashboard • Overview
                </p>
              </div>
            </div>
          </div>

          <div class="p-4 space-y-3">
            <div
              class="h-5 rounded"
              :class="editableTheme.darkMode ? 'bg-gray-700' : 'bg-gray-300'"
            ></div>
            <div class="grid grid-cols-4 gap-2">
              <div
                v-for="i in 4"
                :key="i"
                class="h-14 rounded-lg"
                :class="editableTheme.darkMode ? 'bg-gray-800' : 'bg-white'"
              ></div>
            </div>
            <div
              class="h-32 rounded-lg"
              :class="editableTheme.darkMode ? 'bg-gray-800' : 'bg-white'"
            ></div>
          </div>

          <div class="p-3 border-t" :class="editableTheme.darkMode ? 'border-gray-700' : 'border-gray-200'">
            <button
              class="btn btn-sm"
              :class="editableTheme.darkMode ? 'btn-secondary' : 'btn-primary'"
              :style="{
                borderRadius: editableTheme.radius,
                backgroundColor: editableTheme.darkMode ? undefined : editableTheme.primary,
              }"
            >
              Primary Button
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
