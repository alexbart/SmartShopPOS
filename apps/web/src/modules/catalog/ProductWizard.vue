<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useQuery, useQueryClient, useMutation } from '@tanstack/vue-query';
import { useRouter, useRoute } from 'vue-router';
import { Save, ChevronLeft, ChevronRight, Package, X } from '@lucide/vue';
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import ImageUploader from '@/modules/catalog/components/ImageUploader.vue';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

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
const isEditing = computed(() => !!route.params.id);
const productId = computed(() => route.params.id as string | undefined);

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

// Reference data
const { data: categoriesData } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => (await apiClient.get('/categories')).data.data.items,
  staleTime: 60_000,
});
const { data: unitsData } = useQuery({
  queryKey: ['units'],
  queryFn: async () => (await apiClient.get('/units')).data.data.items,
  staleTime: 60_000,
});
const { data: brandsData } = useQuery({
  queryKey: ['brands'],
  queryFn: async () => (await apiClient.get('/brands')).data.data.items,
  staleTime: 60_000,
});
const { data: taxesData } = useQuery({
  queryKey: ['taxes'],
  queryFn: async () => (await apiClient.get('/taxes')).data.data.items,
  staleTime: 60_000,
});

// Fetch existing product when editing
const { data: existingProduct, isLoading: isLoadingProduct } = useQuery({
  queryKey: ['product', productId],
  queryFn: async () => (await apiClient.get(`/products/${productId.value}`)).data.data,
  enabled: isEditing,
  staleTime: 0,
});

// Populate form when product data arrives — this is the core fix
watch(
  existingProduct,
  (product) => {
    if (!product) return;
    nextTick(() => {
      form.setValues({
        name: product.name ?? '',
        code: product.code ?? '',
        sku: product.sku ?? '',
        barcode: product.barcode ?? '',
        description: product.description ?? '',
        sellingPrice: Number(product.sellingPrice) ?? 0,
        costPrice: Number(product.costPrice) ?? 0,
        stockQuantity: Number(product.stockQuantity) ?? 0,
        lowStockThreshold: Number(product.lowStockThreshold) ?? 0,
        unitId: product.unitId ?? '',
        categoryId: product.categoryId ?? '',
        brandId: product.brandId ?? '',
        taxId: product.taxId ?? '',
        isActive: product.isActive ?? true,
      });
    });
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

const saveMutation = useMutation({
  mutationFn: (payload: any) =>
    isEditing.value
      ? apiClient.put(`/products/${productId.value}`, payload)
      : apiClient.post('/products', payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['product', productId.value] });
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

      <Form :form="form">
        <!-- Step 1: Basic Info -->
        <Card v-if="activeStep === 1">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Name, SKU, barcode and description.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <FormField v-slot="{ componentField }" name="name" :form="form">
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Coca Cola 500ml" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField v-slot="{ componentField }" name="code" :form="form">
                <FormItem>
                  <FormLabel>Product Code</FormLabel>
                  <FormControl>
                    <Input placeholder="COKE-001" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="sku" :form="form">
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="COKE-500ML" v-bind="componentField" />
                  </FormControl>
                  <FormDescription>Stock Keeping Unit</FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="barcode" :form="form">
                <FormItem>
                  <FormLabel>Barcode</FormLabel>
                  <FormControl>
                    <Input placeholder="6001234567890" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <FormField v-slot="{ componentField }" name="description" :form="form">
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
              <FormField v-slot="{ componentField }" name="sellingPrice" :form="form">
                <FormItem>
                  <FormLabel>Selling Price (KES) *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" step="0.01" min="0" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="costPrice" :form="form">
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
            <FormField v-slot="{ value, handleChange }" name="taxId" :form="form">
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
              <FormField v-slot="{ componentField }" name="stockQuantity" :form="form">
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" min="0" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="lowStockThreshold" :form="form">
                <FormItem>
                  <FormLabel>Low Stock Threshold</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" min="0" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <FormField v-slot="{ value, handleChange }" name="unitId" :form="form">
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

            <FormField v-slot="{ value, handleChange }" name="categoryId" :form="form">
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

            <FormField v-slot="{ value, handleChange }" name="brandId" :form="form">
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
      </Form>

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
    </template>
  </div>
</template>
