<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import {
  Save,
  Globe,
  MapPin,
  Clock,
  FileText,
  CreditCard,
} from '@lucide/vue';
import { useOrganization } from '../composables/useAdmin.js';
import { useOrganizationStore } from '@/stores/organization';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';

const { organization, organizationLoading, organizationError, updateMutation } = useOrganization();

// The POS caches branding for the session, so invalidate it after a profile save.
const organizationStore = useOrganizationStore();

const editing = ref(false);

const form = reactive({
  businessName: '', tagline: '', businessType: '', email: '', phone: '', kraPin: '',
  vatNumber: '', currency: 'KES', timezone: 'Africa/Nairobi', website: '', receiptFooter: '', logoUrl: '',
});

watch(organization, (value) => {
  if (!value) return;
  Object.assign(form, {
    businessName: value.businessName || value.name || '',
    tagline: value.tagline || '',
    businessType: value.businessType || '',
    email: value.email || '',
    phone: value.phone || '',
    kraPin: value.kraPin || '',
    vatNumber: value.vatNumber || '',
    currency: value.currency || 'KES',
    timezone: value.timezone || 'Africa/Nairobi',
    website: value.website || '',
    receiptFooter: value.receiptFooter || '',
    logoUrl: value.logoUrl || '',
  });
}, { immediate: true });

const currencies = ['KES', 'USD', 'EUR', 'GBP'];
const timezones = ['Africa/Nairobi', 'Europe/London', 'America/New_York', 'Asia/Dubai'];
const businessTypes = ['Retail', 'Wholesale', 'Service', 'Manufacturing', 'Hospitality'];

async function handleSave() {
  try {
    await updateMutation.mutateAsync({
      businessName: form.businessName,
      tagline: form.tagline,
      businessType: form.businessType,
      email: form.email,
      phone: form.phone,
      kraPin: form.kraPin,
      vatNumber: form.vatNumber,
      currency: form.currency,
      timezone: form.timezone,
      website: form.website,
      receiptFooter: form.receiptFooter,
      logoUrl: form.logoUrl.trim(),
    });
    organizationStore.reset();
    editing.value = false;
  } catch {
    // The API interceptor reports the error; retain the form for corrections.
  }
}
</script>

<template>
  <WorkspaceShell
    workspace-title="Organization Profile"
    workspace-description="Configure your businesses identity and financial settings"
  >
    <div class="space-y-6">
      <div v-if="organizationLoading" class="space-y-4">
        <div v-for="i in 8" :key="i" class="h-12 bg-muted/30 rounded animate-pulse"></div>
      </div>

      <div v-else-if="organizationError" class="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm">
        Could not load the organization profile. Check your access and API connection, then reload this page.
      </div>

      <div v-else class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
              <img
                v-if="form.logoUrl"
                :src="form.logoUrl"
                alt="Logo"
                class="w-full h-full object-contain"
              />
              <FileText v-else class="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h2 class="text-xl font-bold">{{ form.businessName || organization?.name }}</h2>
              <p class="text-sm text-muted-foreground">{{ form.tagline || 'No tagline set' }}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button v-if="!editing" @click="editing = true" class="btn btn-outline touch-target">
              Edit
            </button>
            <button v-if="editing" @click="handleSave" :disabled="updateMutation.isPending.value" class="btn btn-primary touch-target">
              <Save class="w-4 h-4 mr-2" />
              {{ updateMutation.isPending.value ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-4 space-y-4">
            <h3 class="font-medium flex items-center gap-2">
              <Globe class="w-4 h-4" />
              Business Details
            </h3>

            <div>
              <label class="block text-sm font-medium mb-1">Business Name</label>
              <input v-model="form.businessName" type="text" class="input w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Tagline</label>
              <input v-model="form.tagline" type="text" class="input w-full" placeholder="Your business tagline" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Business Type</label>
              <select v-model="form.businessType" class="input w-full">
                <option value="">Select</option>
                <option v-for="t in businessTypes" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">KRA PIN</label>
              <input v-model="form.kraPin" type="text" class="input w-full" placeholder="PINA12345678" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">VAT Number</label>
              <input v-model="form.vatNumber" type="text" class="input w-full" placeholder="VAT12345678" />
            </div>
          </div>

          <div class="card p-4 space-y-4">
            <h3 class="font-medium flex items-center gap-2">
              <MapPin class="w-4 h-4" />
              Contact & Financial
            </h3>

            <div>
              <label class="block text-sm font-medium mb-1">Email</label>
              <input v-model="form.email" type="email" class="input w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Phone</label>
              <input v-model="form.phone" type="tel" class="input w-full" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Website</label>
              <input v-model="form.website" type="url" class="input w-full" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Currency</label>
                <select v-model="form.currency" class="input w-full">
                  <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Timezone</label>
                <select v-model="form.timezone" class="input w-full">
                  <option v-for="t in timezones" :key="t" :value="t">{{ t }}</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Receipt Footer</label>
              <textarea v-model="form.receiptFooter" class="input w-full" rows="3" placeholder="Enter footer text..."></textarea>
            </div>
          </div>
        </div>

        <div class="card p-4">
          <label class="block text-sm font-medium mb-2">Brand Logo</label>
          <input
            v-model="form.logoUrl"
            type="url"
            class="input w-full"
            placeholder="https://example.com/logo.png"
          />
          <p class="text-xs text-muted-foreground mt-1">
            Printed at the top of every receipt. Use a square PNG with a transparent background
            (at least 400 × 400 px). Leave blank to print no logo.
          </p>
        </div>
      </div>
    </div>
  </WorkspaceShell>
</template>
