<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Upload,
  Save,
  Globe,
  MapPin,
  Clock,
  FileText,
  CreditCard,
} from '@lucide/vue';
import { useOrganization } from '../composables/useAdmin.js';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';

const { organization, organizationLoading, updateMutation } = useOrganization();

const editing = ref(false);

const form = computed(() => ({
  businessName: organization.value?.businessName || organization.value?.name || '',
  tagline: organization.value?.tagline || '',
  businessType: organization.value?.businessType || '',
  email: organization.value?.email || '',
  phone: organization.value?.phone || '',
  kraPin: organization.value?.kraPin || '',
  vatNumber: organization.value?.vatNumber || '',
  currency: organization.value?.currency || 'KES',
  timezone: organization.value?.timezone || 'Africa/Nairobi',
  website: organization.value?.website || '',
  receiptFooter: organization.value?.receiptFooter || '',
  logoUrl: organization.value?.logoUrl || '',
}));

const currencies = ['KES', 'USD', 'EUR', 'GBP'];
const timezones = ['Africa/Nairobi', 'Europe/London', 'America/New_York', 'Asia/Dubai'];
const businessTypes = ['Retail', 'Wholesale', 'Service', 'Manufacturing', 'Hospitality'];

function handleSave() {
  updateMutation.mutateAsync({
    businessName: form.value.businessName,
    tagline: form.value.tagline,
    businessType: form.value.businessType,
    email: form.value.email,
    phone: form.value.phone,
    kraPin: form.value.kraPin,
    vatNumber: form.value.vatNumber,
    currency: form.value.currency,
    timezone: form.value.timezone,
    website: form.value.website,
    receiptFooter: form.value.receiptFooter,
  });
  editing.value = false;
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

      <div v-else class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
              <img
                v-if="form.logoUrl"
                :src="form.logoUrl"
                alt="Logo"
                class="w-full h-full object-cover"
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
            <button v-if="editing" @click="handleSave" :disabled="updateMutation.isPending" class="btn btn-primary touch-target">
              <Save class="w-4 h-4 mr-2" />
              {{ updateMutation.isPending ? 'Saving...' : 'Save' }}
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
          <label class="block text-sm font-medium mb-2">Logo Upload</label>
          <div class="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">
              Drag & drop your logo or click to upload
            </p>
            <input type="file" class="hidden" id="logo-upload" accept="image/*" />
            <label for="logo-upload" class="text-primary text-sm cursor-pointer">Browse files</label>
          </div>
        </div>
      </div>
    </div>
  </WorkspaceShell>
</template>
