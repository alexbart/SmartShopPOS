<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useQuery, useQueryClient, useMutation } from '@tanstack/vue-query';
import { useRouter, useRoute } from 'vue-router';
import { Save, ChevronLeft, ChevronRight, Package, X, AlertTriangle } from '@lucide/vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import ImageUploader from '@/modules/catalog/components/ImageUploader.vue';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import AdjustStockDialog from '@/modules/catalog/components/AdjustStockDialog.vue';
import { useInventory } from '@/modules/catalog/composables/useInventory';

const steps = [
  { key: 1, title: 'Basic Info', description: 'Name, SKU, barcode' },
  { key: 2, title: 'Pricing', description: 'Prices, taxes' },
  { key: 3, title: 'Inventory', description: 'Stock, thresholds' },
  { key: 4, title: 'Images', description: 'Upload images' },
  { key: 5, title: 'Review', description: 'Confirm and save' },
];

const router = useRouter();
const route = useRoute();
const queryClient = useQueryClient();
const activeStep = ref(1);
const productId = computed(() => String(route.params.id ?? ''));
const isEditing = computed(() => !!productId.value);
const existingProduct = ref<ProductData | null>(null);
const isLoadingProduct = ref(false);
const productLoadError = ref<string | null>(null);

const productSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Product name is required'),
    code: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    description: z.string().optional(),
    sellingPrice: z.coerce.number().min(0, 'Selling price is required'),
    costPrice: z.coerce.number().min(0, 'Cost price is required'),
    stockQuantity: z.coerce.number().min(0).default(0),
    lowStockThreshold: z.coerce.number().min(0).default(0),
    unitId: z.string().min(1, 'Unit is required'),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    taxId: z.string().optional(),
    isActive: z.boolean().default(true),
  }),
);

const form = useForm({
  validationSchema: productSchema,
  initialValues: {
    name: '',
    code: '',
    sku: '',
    barcode: '',
    description: '',
    sellingPrice: 0,
    costPrice: 0,
    stockQuantity: 0,
    lowStockThreshold: 0,
    unitId: '',
    categoryId: '',
    brandId: '',
    taxId: '',
    isActive: true,
  },
});

interface Category { id: string; name: string; code: string; description?: string; color?: string; isActive: boolean; }
interface Unit { id: string; name: string; abbreviation: string; }
interface Brand { id: string; name: string; }
interface Tax { id: string; name: string; rate: number; }
interface Warehouse { id: string; name: string; code: string; isDefault: boolean; }

interface ProductData {
  id: string;
  name: string;
  code?: string | null;
  sku?: string | null;
  barcode?: string | null;
  description?: string | null;
  sellingPrice: number | string;
  costPrice: number | string;
  stockQuantity?: number | string;
  lowStockThreshold?: number | string | null;
  unitId: string;
  categoryId?: string | null;
  brandId?: string | null;
  taxId?: string | null;
  isActive: boolean;
}

// Reference data
const { data: categoriesData } = useQuery<Category[]>({
  queryKey: ['categories'],
  queryFn: async () => (await apiClient.get('/categories')).data.data.items,
  staleTime: 60_000,
});
const { data: unitsData } = useQuery<Unit[]>({
  queryKey: ['units'],
  queryFn: async () => (await apiClient.get('/units')).data.data.items,
  staleTime: 60_000,
});
const { data: brandsData } = useQuery<Brand[]>({
  queryKey: ['brands'],
  queryFn: async () => (await apiClient.get('/brands')).data.data.items,
  staleTime: 60_000,
});
const { data: taxesData } = useQuery<Tax[]>({
  queryKey: ['taxes'],
  queryFn: async () => (await apiClient.get('/taxes')).data.data.items,
  staleTime: 60_000,
});

// Warehouses for stock adjustment
const { data: warehousesData } = useQuery<Warehouse[]>({
  queryKey: ['warehouses'],
  queryFn: async () => (await apiClient.get('/warehouses')).data.data.items,
  staleTime: 60_000,
});

function populateProductForm(product: ProductData) {
  form.setValues({
    name: product.name ?? '',
    code: product.code ?? '',
    sku: product.sku ?? '',
    barcode: product.barcode ?? '',
    description: product.description ?? '',
    sellingPrice: Number(product.sellingPrice ?? 0),
    costPrice: Number(product.costPrice ?? 0),
    stockQuantity: Number(product.stockQuantity ?? 0),
    lowStockThreshold: Number(product.lowStockThreshold ?? 0),
    unitId: product.unitId ?? '',
    categoryId: product.categoryId ?? '',
    brandId: product.brandId ?? '',
    taxId: product.taxId ?? '',
    isActive: product.isActive ?? true,
  });
}

async function loadProductForEdit(id: string) {
  isLoadingProduct.value = true;
  productLoadError.value = null;
  existingProduct.value = null;

  try {
    const response = await apiClient.get<{ data?: ProductData }>(`/products/${id}`);
    const product = response.data?.data;
    if (!product?.id) throw new Error('Product response did not contain product data.');

    existingProduct.value = product;
    await nextTick();
    populateProductForm(product);
  } catch (error) {
    productLoadError.value = 'Could not load this product. Please retry or return to the product list.';
    notification.error(productLoadError.value);
  } finally {
    isLoadingProduct.value = false;
  }
}

// Match customer edit: each route ID change fetches the record, then fills the form.
watch(
  productId,
  (id) => {
    if (!id) {
      existingProduct.value = null;
      productLoadError.value = null;
      return;
    }
    void loadProductForEdit(id);
  },
  { immediate: true },
);

// Draft — only for create mode to avoid overwriting real product data
const draftKey = computed(() => `product-draft-new`);
const uploadedImages = ref<string[]>([]);

onMounted(() => {
  if (isEditing.value) return; // never restore draft when editing
  const saved = localStorage.getItem(draftKey.value);
  if (saved) {
    try {
      const draft = JSON.parse(saved);
      nextTick(() => {
        form.setValues(draft.fields);
        uploadedImages.value = draft.images ?? [];
        activeStep.value = draft.step ?? 1;
      });
    } catch {}
  }
});

watch(
  () => form.values,
  (val) => {
    if (isEditing.value) return;
    if (val?.name) {
      localStorage.setItem(
        draftKey.value,
        JSON.stringify({ fields: val, images: uploadedImages.value, step: activeStep.value }),
      );
    }
  },
  { deep: true },
);

// Inventory adjustment
const { adjustStock } = useInventory();
const showAdjustDialog = ref(false);

async function handleAdjustStock(payload: any) {
  try {
    await adjustStock.mutateAsync(payload);
    if (productId.value) await loadProductForEdit(productId.value);
    showAdjustDialog.value = false;
  } catch (error) {
    // Error handled by mutation
  }
}

// Save mutation
const saveMutation = useMutation({
  mutationFn: (payload: any) =>
    isEditing.value
      ? apiClient.patch(`/products/${productId.value}`, payload)
      : apiClient.post('/products', payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    if (!isEditing.value) localStorage.removeItem(draftKey.value);
    notification.success(isEditing.value ? 'Product updated' : 'Product created');
    router.push('/products');
  },
  onError: () => {
    notification.error('Failed to save product');
  },
});

function handleFilesAdded(files: File[]) {
  const promises = files.map(
    (file) =>
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      }),
  );
  Promise.all(promises).then((urls) => {
    uploadedImages.value = [...uploadedImages.value, ...urls];
  });
}

function removeImage(index: number) {
  uploadedImages.value.splice(index, 1);
}

async function handleSubmit() {
  const { valid } = await form.validate();
  if (!valid) {
    notification.error('Please fix validation errors before saving');
    return;
  }
  const v = form.values;
  await saveMutation.mutateAsync({
    name: v.name,
    code: v.code || undefined,
    sku: v.sku || undefined,
    barcode: v.barcode || undefined,
    description: v.description || undefined,
    sellingPrice: Number(v.sellingPrice),
    costPrice: Number(v.costPrice),
    lowStockThreshold: Number(v.lowStockThreshold ?? 0),
    unitId: v.unitId,
    categoryId: v.categoryId || undefined,
    brandId: v.brandId || undefined,
    taxId: v.taxId || undefined,
    isActive: v.isActive,
  });
}

function nextStep() { activeStep.value = Math.min(activeStep.value + 1, steps.length); }
function prevStep() { activeStep.value = Math.max(activeStep.value - 1, 1); }
</script>

<template>
  <div class="p-4 sm:p-6 max-w-3xl mx-auto">
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <RouterLink to="/products" class="hover:underline text-sm">Catalog</RouterLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{{ isEditing ? 'Edit Product' : 'Create Product' }}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </nav>

    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <Package class="h-5 w-5 text-primary" />
      <div>
        <h1 class="text-2xl font-bold">{{ isEditing ? 'Edit Product' : 'Create Product' }}</h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ isEditing ? `Editing: ${existingProduct?.name ?? '…'}` : 'Add a new product to your catalog' }}
        </p>
      </div>
    </div>

    <!-- Loading state for edit -->
    <div v-if="isEditing && isLoadingProduct" class="space-y-4">
      <div v-for="i in 4" :key="i" class="h-12 bg-muted rounded-lg animate-pulse" />
    </div>

    <Card v-else-if="isEditing && productLoadError">
      <CardContent class="flex flex-col items-start gap-4 py-6">
        <p class="text-sm text-destructive">{{ productLoadError }}</p>
        <div class="flex gap-2">
          <Button type="button" variant="outline" @click="router.push('/products')">
            <ChevronLeft class="mr-2 h-4 w-4" /> Back to products
          </Button>
          <Button type="button" @click="loadProductForEdit(productId)">Retry</Button>
        </div>
      </CardContent>
    </Card>

    <template v-else>
      <!-- Step indicators -->
      <div class="flex items-center mb-6 overflow-x-auto gap-0">
        <div v-for="(step, index) in steps" :key="step.key" class="flex items-center">
          <div
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors shrink-0',
              activeStep === step.key
                ? 'bg-primary text-primary-foreground'
                : step.key < activeStep
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground',
            ]"
          >
            {{ step.key }}
          </div>
          <div class="ml-2 mr-1 hidden sm:block">
            <p :class="['text-sm font-medium', activeStep === step.key ? 'text-primary' : 'text-muted-foreground']">
              {{ step.title }}
            </p>
          </div>
          <ChevronRight v-if="index < steps.length - 1" class="w-4 h-4 text-muted-foreground mx-1 shrink-0" />
        </div>
      </div>

      <div>
        <!-- Step 1: Basic Info -->
        <Card v-if="activeStep === 1">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Name, SKU, barcode and description.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Coca Cola 500ml" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField v-slot="{ componentField }" name="code">
                <FormItem>
                  <FormLabel>Product Code</FormLabel>
                  <FormControl>
                    <Input placeholder="COKE-001" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="sku">
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="COKE-500ML" v-bind="componentField" />
                  </FormControl>
                  <FormDescription>Stock Keeping Unit</FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="barcode">
                <FormItem>
                  <FormLabel>Barcode</FormLabel>
                  <FormControl>
                    <Input placeholder="6001234567890" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <FormField v-slot="{ componentField }" name="description">
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Product description..." rows="3" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </CardContent>
        </Card>

        <!-- Step 2: Pricing -->
        <Card v-if="activeStep === 2">
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Set selling price, cost price, and tax.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField v-slot="{ componentField }" name="sellingPrice">
                <FormItem>
                  <FormLabel>Selling Price (KES) *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" step="0.01" min="0" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="costPrice">
                <FormItem>
                  <FormLabel>Cost Price (KES) *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" step="0.01" min="0" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <!-- Tax select — uses value/handleChange pattern for shadcn Select -->
            <FormField v-slot="{ value, handleChange }" name="taxId">
              <FormItem>
                <FormLabel>Tax</FormLabel>
                <Select :model-value="value" @update:model-value="handleChange">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="No tax" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem v-for="t in taxesData" :key="t.id" :value="t.id">
                      {{ t.name }} ({{ t.rate }}%)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription v-if="!taxesData?.length">No taxes configured</FormDescription>
              </FormItem>
            </FormField>
          </CardContent>
        </Card>

        <!-- Step 3: Inventory -->
        <Card v-if="activeStep === 3">
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>Stock levels, unit, category, and brand.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Edit mode: Read-only stock with Adjust button -->
              <FormField v-if="!isEditing" v-slot="{ componentField }" name="stockQuantity">
                <FormItem>
                  <FormLabel>Opening Stock Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" min="0" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <div v-else class="sm:col-span-2">
                <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Current Stock</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ form.values.stockQuantity ?? 0 }} units
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Low stock threshold: {{ form.values.lowStockThreshold ?? 0 }} units
                    </p>
                  </div>
                  <Button variant="outline" @click="showAdjustDialog = true" :disabled="!warehousesData?.length">
                    <AlertTriangle class="w-4 h-4 mr-2" />
                    Adjust Stock
                  </Button>
                </div>
              </div>

              <FormField v-slot="{ componentField }" name="lowStockThreshold">
                <FormItem>
                  <FormLabel>Low Stock Threshold</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" min="0" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <FormField v-slot="{ value, handleChange }" name="unitId">
              <FormItem>
                <FormLabel>Unit *</FormLabel>
                <Select :model-value="value" @update:model-value="handleChange">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem v-for="u in unitsData" :key="u.id" :value="u.id">
                      {{ u.name }} ({{ u.abbreviation }})
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="categoryId">
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select :model-value="value" @update:model-value="handleChange">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem v-for="c in categoriesData" :key="c.id" :value="c.id">
                      {{ c.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            </FormField>

            <FormField v-slot="{ value, handleChange }" name="brandId">
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select :model-value="value" @update:model-value="handleChange">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem v-for="b in brandsData" :key="b.id" :value="b.id">
                      {{ b.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            </FormField>
          </CardContent>
        </Card>

        <!-- Step 4: Images -->
        <Card v-if="activeStep === 4">
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>Upload product images.</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploader :max-files="10" @upload="handleFilesAdded" />
            <div v-if="uploadedImages.length > 0" class="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
              <div v-for="(url, index) in uploadedImages" :key="index" class="relative group">
                <img
                  :src="url"
                  :alt="`Product image ${index + 1}`"
                  class="aspect-square object-cover rounded-lg border border-border"
                />
                <button
                  @click="removeImage(index)"
                  class="absolute top-1 right-1 p-0.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X class="w-3 h-3" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Step 5: Review -->
        <Card v-if="activeStep === 5">
          <CardHeader>
            <CardTitle>Review & Confirm</CardTitle>
            <CardDescription>Please review all details before saving.</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div class="space-y-2">
                <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wide">General</h3>
                <div class="space-y-1">
                  <div class="flex justify-between"><span class="text-muted-foreground">Name</span><span class="font-medium">{{ form.values.name }}</span></div>
                  <div class="flex justify-between"><span class="text-muted-foreground">Code</span><span class="font-mono">{{ form.values.code || '—' }}</span></div>
                  <div class="flex justify-between"><span class="text-muted-foreground">SKU</span><span class="font-mono">{{ form.values.sku || '—' }}</span></div>
                  <div class="flex justify-between"><span class="text-muted-foreground">Barcode</span><span class="font-mono">{{ form.values.barcode || '—' }}</span></div>
                </div>
              </div>
              <div class="space-y-2">
                <h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pricing & Stock</h3>
                <div class="space-y-1">
                  <div class="flex justify-between"><span class="text-muted-foreground">Selling Price</span><span class="font-medium">KES {{ Number(form.values.sellingPrice).toLocaleString() }}</span></div>
                  <div class="flex justify-between"><span class="text-muted-foreground">Cost Price</span><span class="font-medium">KES {{ Number(form.values.costPrice).toLocaleString() }}</span></div>
                  <div class="flex justify-between"><span class="text-muted-foreground">Stock</span><span>{{ form.values.stockQuantity }}</span></div>
                  <div class="flex justify-between"><span class="text-muted-foreground">Images</span><span>{{ uploadedImages.length }} uploaded</span></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between mt-6">
        <Button v-if="activeStep > 1" variant="outline" @click="prevStep">
          <ChevronLeft class="w-4 h-4 mr-1" />
          Back
        </Button>
        <div v-else />

        <div class="flex gap-2">
          <Button variant="outline" @click="router.push('/products')">Cancel</Button>
          <Button v-if="activeStep < steps.length" @click="nextStep">
            Continue
            <ChevronRight class="w-4 h-4 ml-1" />
          </Button>
          <Button v-else :disabled="saveMutation.isPending.value" @click="handleSubmit">
            <Save class="w-4 h-4 mr-2" />
            {{ saveMutation.isPending.value ? 'Saving…' : (isEditing ? 'Update Product' : 'Save Product') }}
          </Button>
        </div>
      </div>

      <!-- Adjust Stock Dialog -->
      <AdjustStockDialog
        v-model:open="showAdjustDialog"
        :product-id="productId"
        :current-stock="form.values.stockQuantity ?? 0"
        :warehouses="warehousesData as any"
        @success="(payload) => handleAdjustStock(payload)"
      />
    </template>
  </div>
</template>
