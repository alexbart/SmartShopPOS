<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  History,
  Upload,
  XCircle,
} from '@lucide/vue';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import { Button } from '@/components/ui/button';
import { useWarehouses } from '@/modules/inventory/composables/useInventory';
import { useDataTransfer } from '../composables/useDataTransfer';

const { data: warehousesData } = useWarehouses();
const warehouses = computed(() => warehousesData.value ?? []);

const warehouseId = ref('');
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const {
  downloading,
  importing,
  processed,
  total,
  progressPercent,
  result,
  problemRows,
  downloadTemplate,
  downloadReport,
  importWorkbook,
} = useDataTransfer();

const exportTargets = [
  { report: 'inventory', label: 'Inventory stock' },
  { report: 'low-stock', label: 'Low stock' },
  { report: 'sales', label: 'Sales' },
  { report: 'customers', label: 'Customers' },
];

// Preselect the shop's default warehouse: it is where opening stock almost always belongs.
watch(
  warehouses,
  (list) => {
    if (warehouseId.value || list.length === 0) return;
    warehouseId.value = (list.find((warehouse) => warehouse.isDefault) ?? list[0]).id;
  },
  { immediate: true },
);

const canImport = computed(
  () => Boolean(selectedFile.value && warehouseId.value) && !importing.value,
);

const statusStyles: Record<string, string> = {
  COMPLETED: 'bg-success/10 text-success border-success/20',
  PARTIAL: 'bg-warning/10 text-warning border-warning/20',
  FAILED: 'bg-destructive/10 text-destructive border-destructive/20',
};

function pickFile(event: Event) {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] ?? null;
}

async function startImport() {
  if (!selectedFile.value || !warehouseId.value) return;
  try {
    await importWorkbook(selectedFile.value, warehouseId.value);
    selectedFile.value = null;
    if (fileInput.value) fileInput.value.value = '';
  } catch {
    // The axios interceptor already showed the API's message.
  }
}
</script>

<template>
  <WorkspaceShell
    workspace-title="Data"
    workspace-description="Import and export your catalogue as branded, timestamped Excel workbooks"
    :action-button="{
      label: 'Download template',
      icon: Download,
      variant: 'outline',
      loading: downloading === 'template',
      onClick: downloadTemplate,
    }"
  >
    <div class="space-y-6">
      <div class="rounded-xl border bg-card p-5">
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileSpreadsheet class="h-5 w-5 text-primary" />
          </div>
          <div class="space-y-1">
            <h2 class="font-semibold">One template, every product field</h2>
            <p class="text-sm text-muted-foreground">
              The template mirrors the products module: names, codes, prices, tax, category, brand,
              unit and opening stock. Unit, Category, Brand and Tax Rate are dropdowns limited to
              what your catalogue already contains.
            </p>
            <p class="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
              <History class="h-3.5 w-3.5" />
              Every download and every import is stamped with your business name, a document ID and
              a timestamp, and recorded in the
              <RouterLink to="/admin/audit" class="underline hover:text-foreground"
                >Audit Center</RouterLink
              >.
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section class="rounded-xl border bg-card p-5">
          <div class="mb-4 flex items-center gap-2">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >1</span
            >
            <h2 class="font-semibold">Get the template</h2>
          </div>
          <p class="text-sm text-muted-foreground">
            Download a fresh copy each time you plan a batch. It lists your current units,
            categories, brands and tax rates on the Reference sheet.
          </p>
          <Button
            class="mt-4"
            variant="outline"
            :disabled="downloading === 'template'"
            @click="downloadTemplate"
          >
            <Download class="mr-2 h-4 w-4" />
            Download .xlsx template
          </Button>
        </section>

        <section class="rounded-xl border bg-card p-5">
          <div class="mb-4 flex items-center gap-2">
            <span
              class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >2</span
            >
            <h2 class="font-semibold">Upload the filled-in file</h2>
          </div>

          <label class="block space-y-1 text-sm">
            <span class="text-muted-foreground">Opening stock goes to</span>
            <select
              v-model="warehouseId"
              class="w-full rounded-md border bg-background px-3 py-2"
              :disabled="importing"
            >
              <option value="" disabled>Select a warehouse</option>
              <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.name }}
              </option>
            </select>
          </label>

          <label class="mt-3 block space-y-1 text-sm">
            <span class="text-muted-foreground">Workbook</span>
            <input
              ref="fileInput"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              class="w-full cursor-pointer rounded-md border bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5"
              :disabled="importing"
              @change="pickFile"
            />
          </label>

          <Button class="mt-4" :disabled="!canImport" @click="startImport">
            <Upload class="mr-2 h-4 w-4" />
            {{ importing ? 'Importing…' : 'Start import' }}
          </Button>

          <div v-if="importing || result" class="mt-4 space-y-2">
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>{{ processed }} of {{ total }} rows</span>
              <span>{{ progressPercent }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${progressPercent}%` }"
              />
            </div>
          </div>

          <p class="mt-4 text-xs text-muted-foreground">
            Existing products are skipped, never overwritten: the report tells you which rows were
            left alone so prices can't change behind your back.
          </p>
        </section>
      </div>

      <section v-if="result" class="rounded-xl border bg-card p-5">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-semibold">Import result</h2>
          <span
            class="rounded-full border px-2.5 py-1 text-xs font-medium"
            :class="statusStyles[result.status]"
          >
            {{ result.status }}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <p class="text-sm text-muted-foreground">Created</p>
            <p class="mt-1 flex items-center gap-1.5 text-lg font-semibold">
              <CheckCircle2 class="h-4 w-4 text-success" />{{ result.successfulRows }}
            </p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Skipped</p>
            <p class="mt-1 flex items-center gap-1.5 text-lg font-semibold">
              <AlertTriangle class="h-4 w-4 text-warning" />{{ result.skippedRows }}
            </p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Failed</p>
            <p class="mt-1 flex items-center gap-1.5 text-lg font-semibold">
              <XCircle class="h-4 w-4 text-destructive" />{{ result.failedRows }}
            </p>
          </div>
        </div>

        <div v-if="problemRows.length" class="mt-5">
          <h3 class="mb-2 text-sm font-medium">Rows that need attention</h3>
          <div class="max-h-72 overflow-y-auto rounded-lg border">
            <table class="w-full text-sm">
              <thead class="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th class="px-3 py-2 w-20">Row</th>
                  <th class="px-3 py-2 w-24">Result</th>
                  <th class="px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in problemRows" :key="row.rowNumber" class="border-t">
                  <td class="px-3 py-2 font-mono">{{ row.rowNumber }}</td>
                  <td class="px-3 py-2">{{ row.status }}</td>
                  <td class="px-3 py-2 text-muted-foreground">{{ row.error ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" @click="$router.push('/products')">View products</Button>
          <Button variant="ghost" @click="$router.push('/admin/audit')">Open Audit Center</Button>
        </div>
      </section>

      <section class="rounded-xl border bg-card p-5">
        <div class="mb-4 flex items-center gap-2">
          <Download class="h-4 w-4 text-primary" />
          <h2 class="font-semibold">Export a report</h2>
        </div>
        <p class="text-sm text-muted-foreground">
          Excel exports carry the same header and footer as the import template: business name,
          document ID, timestamp and row count. Each download is an EXPORT event in the Audit
          Center.
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <Button
            v-for="target in exportTargets"
            :key="target.report"
            variant="outline"
            :disabled="downloading === target.report"
            @click="downloadReport(target.report, target.label)"
          >
            <Download class="mr-2 h-4 w-4" />
            {{ target.label }}
          </Button>
        </div>
      </section>
    </div>
  </WorkspaceShell>
</template>
