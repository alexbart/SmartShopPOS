<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useReceiptTemplateStore } from '@/modules/sales/composables/useReceiptTemplate';
import { useOrganizationStore } from '@/stores/organization';
import { notification } from '@/stores/notification';
import type {
  ReceiptSectionConfig,
  ReceiptStyleConfig,
  ReceiptTemplate,
  ReceiptTemplateInput,
  ReceiptTemplateView,
  PaperWidth,
  Alignment,
} from '@/modules/sales/composables/receipt-template';
import { DEFAULT_SECTIONS, DEFAULT_STYLES } from '@/modules/sales/composables/receipt-template';
import type { ReceiptData } from '@/modules/sales/composables/types';
import ReceiptPreview from '@/modules/sales/components/ReceiptPreview.vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Copy, FileText, Loader2, Plus, Save, Star, Trash2 } from '@lucide/vue';

const route = useRoute();
const router = useRouter();
const templateStore = useReceiptTemplateStore();
const organizationStore = useOrganizationStore();

type SectionKey = keyof ReceiptSectionConfig;
type NumericStyleKey = 'fontSize' | 'lineHeight' | 'sectionSpacing' | 'logoWidth' | 'logoMaxHeight';

interface SectionOption {
  key: SectionKey;
  label: string;
  description: string;
}

interface StyleOption {
  key: NumericStyleKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const sectionOptions: SectionOption[] = [
  { key: 'showLogo', label: 'Business logo', description: 'Logo above the business name' },
  { key: 'showBusinessName', label: 'Business name', description: 'Organization name' },
  { key: 'showTagline', label: 'Tagline', description: 'Short slogan under the name' },
  { key: 'showContact', label: 'Contact details', description: 'Phone and website' },
  { key: 'showTaxInfo', label: 'Tax details', description: 'KRA PIN and VAT number' },
  { key: 'showCustomer', label: 'Customer', description: 'Customer name when set' },
  { key: 'showItems', label: 'Items', description: 'Line items with quantities' },
  { key: 'showSubtotal', label: 'Subtotal', description: 'Subtotal row' },
  { key: 'showTax', label: 'Tax', description: 'Tax row' },
  { key: 'showDiscount', label: 'Discount', description: 'Discount row when applied' },
  { key: 'showPaymentMethod', label: 'Payment method', description: 'Cash, card, M-Pesa' },
  { key: 'showCashier', label: 'Cashier', description: 'Who served the sale' },
  { key: 'showFooter', label: 'Footer', description: 'Closing message' },
  { key: 'showPoweredBy', label: 'SmartShop branding', description: '"Powered by" line' },
];

const styleOptions: StyleOption[] = [
  { key: 'fontSize', label: 'Font size', min: 8, max: 18, step: 1, unit: 'px' },
  { key: 'lineHeight', label: 'Line spacing', min: 1, max: 2.5, step: 0.1, unit: '' },
  { key: 'sectionSpacing', label: 'Section spacing', min: 0, max: 24, step: 1, unit: 'px' },
  { key: 'logoWidth', label: 'Logo width', min: 20, max: 80, step: 5, unit: '%' },
  { key: 'logoMaxHeight', label: 'Logo height', min: 8, max: 30, step: 1, unit: 'mm' },
];

const paperWidths: { value: PaperWidth; label: string }[] = [
  { value: 58, label: '58mm' },
  { value: 80, label: '80mm' },
];

const alignments: { value: Alignment; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

// Illustrative transaction — real values always come from the completed sale.
const sampleReceipt: ReceiptData = {
  number: 'INV-000123',
  timestamp: new Date().toLocaleString('en-KE'),
  customerName: 'John Doe',
  items: [
    { name: 'Product A', quantity: 2, price: 250, total: 500 },
    { name: 'Product B', quantity: 1, price: 300, total: 300 },
  ],
  subtotal: 800,
  tax: 128,
  discount: 0,
  total: 928,
  paymentMethod: 'CASH',
  cashier: 'Jane Smith',
};

const activeTab = ref<'design' | 'templates'>('design');
const loading = ref(false);
const saving = ref(false);
const isEditing = ref(false);

const localName = ref('');
const localIsDefault = ref(false);
const localSections = ref<ReceiptSectionConfig>({ ...DEFAULT_SECTIONS });
const localStyles = ref<ReceiptStyleConfig>({ ...DEFAULT_STYLES });
const localHeaderText = ref('');
const localFooterText = ref('');

const templateId = computed(() => (route.params.id as string | undefined) || null);
const branding = computed(() => organizationStore.branding);

const previewTemplate = computed<ReceiptTemplateView>(() => ({
  sections: localSections.value,
  styles: localStyles.value,
  headerText: localHeaderText.value,
  footerText: localFooterText.value,
}));

const paperWidthClass = computed(() =>
  localStyles.value.paperWidth === 58 ? 'max-w-[58mm]' : 'max-w-[80mm]',
);

const hasTemplates = computed(() => templateStore.templates.length > 0);

function applyTemplate(template: ReceiptTemplate) {
  localName.value = template.name;
  localIsDefault.value = template.isDefault;
  localSections.value = { ...DEFAULT_SECTIONS, ...template.sections };
  localStyles.value = { ...DEFAULT_STYLES, ...template.styles };
  localHeaderText.value = template.headerText || '';
  localFooterText.value = template.footerText || '';
}

function resetForm() {
  localName.value = '';
  localIsDefault.value = false;
  localSections.value = { ...DEFAULT_SECTIONS };
  localStyles.value = { ...DEFAULT_STYLES };
  localHeaderText.value = '';
  localFooterText.value = '';
}

function toggleSection(key: SectionKey) {
  localSections.value[key] = !localSections.value[key];
}

function reportFailure(title: string) {
  notification.error(title, templateStore.error || 'Please try again.');
  templateStore.resetError();
}

async function hydrate(id: string | null) {
  isEditing.value = Boolean(id);

  if (!id) {
    resetForm();
    return;
  }

  loading.value = true;
  const template = await templateStore.loadTemplate(id);
  loading.value = false;

  if (!template) {
    reportFailure('Template not found');
    router.replace({ name: 'receipt-designer' });
    return;
  }

  applyTemplate(template);
}

async function saveTemplate() {
  const name = localName.value.trim();
  if (!name) {
    notification.error('Name required', 'Give the template a name before saving.');
    return;
  }

  const input: ReceiptTemplateInput = {
    name,
    isDefault: localIsDefault.value,
    sections: localSections.value,
    styles: localStyles.value,
    headerText: localHeaderText.value.trim(),
    footerText: localFooterText.value.trim(),
  };

  saving.value = true;

  if (isEditing.value && templateId.value) {
    const updated = await templateStore.updateTemplate(templateId.value, input);
    saving.value = false;
    if (updated) {
      notification.success('Template saved', `"${updated.name}" is up to date.`);
    } else {
      reportFailure('Could not save template');
    }
    return;
  }

  const created = await templateStore.createTemplate(input);
  saving.value = false;

  if (!created) {
    reportFailure('Could not create template');
    return;
  }

  notification.success('Template created', `"${created.name}" is ready to use.`);
  router.replace({ name: 'receipt-designer-edit', params: { id: created.id } });
}

async function startNewTemplate() {
  resetForm();
  activeTab.value = 'design';
  if (route.name !== 'receipt-designer') {
    await router.push({ name: 'receipt-designer' });
  }
}

async function duplicateTemplate(template: ReceiptTemplate) {
  saving.value = true;
  const copy = await templateStore.createTemplate({
    name: `${template.name} (Copy)`,
    isDefault: false,
    sections: template.sections,
    styles: template.styles,
    headerText: template.headerText,
    footerText: template.footerText,
  });
  saving.value = false;

  if (!copy) {
    reportFailure('Could not duplicate template');
    return;
  }

  notification.success('Template duplicated', `"${copy.name}" was created.`);
  await router.push({ name: 'receipt-designer-edit', params: { id: copy.id } });
}

async function removeTemplate(template: ReceiptTemplate) {
  if (template.isDefault) {
    notification.warning(
      'Default template',
      'Set another template as default before deleting this one.',
    );
    return;
  }
  if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return;

  const deleted = await templateStore.deleteTemplate(template.id);
  if (!deleted) {
    reportFailure('Could not delete template');
    return;
  }

  notification.success('Template deleted', `"${template.name}" was removed.`);

  if (templateId.value === template.id) {
    await router.replace({ name: 'receipt-designer' });
  }
}

async function makeDefault(template: ReceiptTemplate) {
  const updated = await templateStore.setDefaultTemplate(template.id);
  if (!updated) {
    reportFailure('Could not set default');
    return;
  }

  if (templateId.value === template.id) {
    localIsDefault.value = true;
  }

  notification.success('Default updated', `"${template.name}" now prints at the till.`);
}

watch(
  () => templateId.value,
  (id) => {
    void hydrate(id);
  },
  { immediate: true },
);

onMounted(async () => {
  void organizationStore.ensureLoaded();
  if (!templateStore.templates.length) {
    await templateStore.loadTemplates();
  }
});
</script>

<template>
  <div class="container mx-auto space-y-6 py-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Receipt Designer</h1>
        <p class="text-muted-foreground">
          Design the receipt your shop prints, then save it as a reusable template.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button variant="outline" :disabled="saving" @click="startNewTemplate">
          <Plus class="mr-1 h-4 w-4" />
          New template
        </Button>
        <Button :disabled="saving || loading" @click="saveTemplate">
          <Loader2 v-if="saving" class="mr-1 h-4 w-4 animate-spin" />
          <Save v-else class="mr-1 h-4 w-4" />
          {{ isEditing ? 'Save changes' : 'Create template' }}
        </Button>
      </div>
    </div>

    <Tabs v-model="activeTab">
      <TabsList class="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="design">Design</TabsTrigger>
        <TabsTrigger value="templates">Saved templates</TabsTrigger>
      </TabsList>

      <TabsContent value="design">
        <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div class="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template details</CardTitle>
                <CardDescription
                  >Applies to every receipt printed with this template.</CardDescription
                >
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-1.5">
                    <Label for="template-name">Template name</Label>
                    <Input id="template-name" v-model="localName" placeholder="e.g. Counter 80mm" />
                  </div>

                  <div class="flex items-end">
                    <label class="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        v-model="localIsDefault"
                        type="checkbox"
                        class="h-4 w-4 accent-[var(--primary)]"
                      />
                      Use as default at the till
                    </label>
                  </div>
                </div>

                <Separator />

                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-1.5">
                    <Label for="header-text">Header text</Label>
                    <Textarea
                      id="header-text"
                      v-model="localHeaderText"
                      rows="2"
                      placeholder="Optional line under the business details"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <Label for="footer-text">Footer text</Label>
                    <Textarea
                      id="footer-text"
                      v-model="localFooterText"
                      rows="2"
                      placeholder="e.g. Goods sold are not returnable"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paper and typography</CardTitle>
                <CardDescription>Match the receipt to your thermal roll.</CardDescription>
              </CardHeader>
              <CardContent class="space-y-5">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label>Paper width</Label>
                    <div class="inline-flex rounded-md border p-0.5">
                      <button
                        v-for="option in paperWidths"
                        :key="option.value"
                        type="button"
                        class="rounded px-3 py-1.5 text-sm transition-colors"
                        :class="
                          localStyles.paperWidth === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        "
                        @click="localStyles.paperWidth = option.value"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <Label>Header alignment</Label>
                    <div class="inline-flex rounded-md border p-0.5">
                      <button
                        v-for="option in alignments"
                        :key="option.value"
                        type="button"
                        class="rounded px-3 py-1.5 text-sm capitalize transition-colors"
                        :class="
                          localStyles.alignment === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        "
                        @click="localStyles.alignment = option.value"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                  </div>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div v-for="style in styleOptions" :key="style.key" class="space-y-1.5">
                    <Label class="flex items-center justify-between">
                      <span>{{ style.label }}</span>
                      <span class="text-xs text-muted-foreground">
                        {{ localStyles[style.key] }}{{ style.unit }}
                      </span>
                    </Label>
                    <Slider
                      v-model="localStyles[style.key]"
                      :min="style.min"
                      :max="style.max"
                      :step="style.step"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receipt sections</CardTitle>
                <CardDescription>Turn off only what your shop does not need.</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  <label
                    v-for="section in sectionOptions"
                    :key="section.key"
                    class="flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <input
                      :checked="localSections[section.key]"
                      type="checkbox"
                      class="mt-0.5 h-4 w-4 accent-[var(--primary)]"
                      @change="toggleSection(section.key)"
                    />
                    <span class="min-w-0">
                      <span class="block text-sm font-medium">{{ section.label }}</span>
                      <span class="block text-xs text-muted-foreground">{{
                        section.description
                      }}</span>
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div class="lg:sticky lg:top-6 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Live preview</CardTitle>
                <CardDescription>
                  Sample transaction · {{ localStyles.paperWidth }}mm paper
                </CardDescription>
              </CardHeader>
              <CardContent class="bg-muted/40">
                <div v-if="loading" class="flex h-64 items-center justify-center">
                  <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
                <div v-else class="mx-auto w-full" :class="paperWidthClass">
                  <ReceiptPreview
                    :receipt="sampleReceipt"
                    :branding="branding"
                    :template="previewTemplate"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="templates">
        <Card class="mt-6">
          <CardHeader class="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Saved templates</CardTitle>
              <CardDescription
                >The default template prints automatically at the till.</CardDescription
              >
            </div>
            <Button variant="outline" @click="startNewTemplate">
              <Plus class="mr-1 h-4 w-4" />
              Create new
            </Button>
          </CardHeader>
          <CardContent>
            <div v-if="!hasTemplates" class="py-12 text-center text-muted-foreground">
              <FileText class="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p class="text-lg font-medium">No templates yet</p>
              <p class="text-sm">Create your first receipt template to control what prints.</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="template in templateStore.templates"
                :key="template.id"
                class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted"
                  >
                    <FileText class="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="truncate font-medium">{{ template.name }}</p>
                      <span
                        v-if="template.isDefault"
                        class="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      >
                        Default
                      </span>
                    </div>
                    <p class="text-sm text-muted-foreground">
                      {{ template.styles.paperWidth }}mm · updated
                      {{ new Date(template.updatedAt).toLocaleDateString('en-KE') }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    :disabled="template.isDefault"
                    @click="makeDefault(template)"
                  >
                    <Star class="mr-1 h-4 w-4" />
                    Set default
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="
                      router.push({ name: 'receipt-designer-edit', params: { id: template.id } })
                    "
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Duplicate"
                    @click="duplicateTemplate(template)"
                  >
                    <Copy class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    class="text-destructive"
                    title="Delete"
                    :disabled="template.isDefault"
                    @click="removeTemplate(template)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
