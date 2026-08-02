<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useQuery, useQueryClient, useMutation } from '@tanstack/vue-query';
import { useRouter, useRoute } from 'vue-router';
import {
  Save,
  ChevronLeft,
  ChevronRight,
  Package,
  X,
} from '@lucide/vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import ImageUploader from '@/modules/catalog/components/ImageUploader.vue';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

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

const { data: categoriesData } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const res = await apiClient.get('/categories');
    return res.data.data.items;
  },
});

const { data: unitsData } = useQuery({
  queryKey: ['units'],
  queryFn: async () => {
    const res = await apiClient.get('/units');
    return res.data.data.items;
  },
});

const { data: brandsData } = useQuery({
  queryKey: ['brands'],
  queryFn: async () => {
    const res = await apiClient.get('/brands');
    return res.data.data.items;
  },
});

const { data: taxesData } = useQuery({
  queryKey: ['taxes'],
  queryFn: async () => {
    const res = await apiClient.get('/taxes');
    return res.data.data.items;
  },
});

const { data: existingProduct } = useQuery({
  queryKey: ['product', route.params.id as string],
  queryFn: async () => {
    const res = await apiClient.get(`/products/${route.params.id}`);
    return res.data.data;
  },
  enabled: isEditing.value,
});

watch(
  () => existingProduct.value,
  (product) => {
    if (product) {
      nextTick(() => {
        form.setValues({
        name: product.name ?? '',
        code: product.code ?? '',
        sku: product.sku ?? '',
        barcode: product.barcode ?? '',
        description: product.description ?? '',
        sellingPrice: product.sellingPrice ?? 0,
        costPrice: product.costPrice ?? 0,
        stockQuantity: product.stockQuantity ?? 0,
        lowStockThreshold: product.lowStockThreshold ?? 0,
        unitId: product.unitId ?? '',
        categoryId: product.categoryId ?? '',
        brandId: product.brandId ?? '',
        taxId: product.taxId ?? '',
        isActive: product.isActive ?? true,
        });
      });
    }
  },
  { immediate: true },
);

const saveMutation = useMutation({
  mutationFn: (payload: any) =>
    isEditing.value
      ? apiClient.put(`/products/${route.params.id}`, payload)
      : apiClient.post('/products', payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    localStorage.removeItem(draftKey.value);
    notification.success(
      isEditing.value ? 'Product updated' : 'Product created',
      (form.values as any).value?.name,
    );
    router.push('/products');
  },
  onError: () => {
    notification.error('Failed to save product');
  },
});

const uploadedImages = ref<string[]>([]);
const draftKey = computed(() => `product-draft-${route.params.id ?? 'new'}`);

onMounted(() => {
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
  () => (form.values as any).value,
  (val: any) => {
    if (val?.name) {
      localStorage.setItem(
        draftKey.value,
        JSON.stringify({
          fields: val,
          images: uploadedImages.value,
          step: activeStep.value,
        }),
      );
    }
  },
  { deep: true },
);

function handleFilesAdded(files: File[]) {
  const promises = files.map((file) => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  });
  Promise.all(promises).then((urls) => {
    uploadedImages.value = [...uploadedImages.value, ...urls];
  });
}

function removeImage(index: number) {
  uploadedImages.value.splice(index, 1);
}

async function handleSubmit() {
  const valid = await form.validate();
  if (!valid.valid) {
    notification.error('Please fix validation errors');
    return;
  }
  const values = (form.values as any).value;
  await saveMutation.mutateAsync({
    name: values.name,
    code: values.code || undefined,
    sku: values.sku || undefined,
    barcode: values.barcode || undefined,
    description: values.description || undefined,
    sellingPrice: Number(values.sellingPrice),
    costPrice: Number(values.costPrice),
    stockQuantity: Number(values.stockQuantity),
    lowStockThreshold: Number(values.lowStockThreshold),
    unitId: values.unitId,
    categoryId: values.categoryId || undefined,
    brandId: values.brandId || undefined,
    taxId: values.taxId || undefined,
    isActive: values.isActive,
  });
}

function nextStep() {
  activeStep.value = Math.min(activeStep.value + 1, steps.length);
}

function prevStep() {
  activeStep.value = Math.max(activeStep.value - 1, 1);
}

function goToProducts() {
  router.push('/products');
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="flex items-center gap-3 mb-6">
      <nav aria-label="breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <RouterLink to="/products" class="hover:underline">Catalog</RouterLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ isEditing ? 'Edit Product' : 'Create Product' }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </nav>
    </div>

    <div class="flex items-center gap-3 mb-6">
      <Package class="h-5 w-5 text-primary" />
      <div>
        <h1 class="text-2xl font-bold">
          {{ isEditing ? 'Edit Product' : 'Create Product' }}
        </h1>
        <p class="text-sm text-muted-foreground mt-0.5">
          {{ isEditing ? 'Update product details' : 'Add a new product to your catalog' }}
        </p>
      </div>
    </div>

    <div class="flex items-center mb-6 overflow-x-auto">
      <div
        v-for="(step, index) in steps"
        :key="step.key"
        class="flex items-center"
      >
        <div
          :class="[
            'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
            activeStep === step.key
              ? 'bg-primary text-primary-foreground'
              : step.key < activeStep
                ? 'bg-success text-success-foreground'
                : 'bg-muted text-muted-foreground',
          ]"
        >
          {{ step.key }}
        </div>
        <div class="ml-3 hidden sm:block">
          <p
            :class="[
              'text-sm font-medium',
              activeStep === step.key ? 'text-primary' : 'text-muted-foreground',
            ]"
          >
            {{ step.title }}
          </p>
          <p class="text-xs text-muted-foreground/70">
            {{ step.description }}
          </p>
        </div>
        <ChevronRight
          v-if="index < steps.length - 1"
          class="w-4 h-4 text-muted-foreground mx-2 flex-shrink-0"
        />
      </div>
    </div>

    <Form :form="form">
      <div class="space-y-6 animate-fadeIn">
        <Card v-if="activeStep === 1" class="transition-all duration-200">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the product name, SKU, barcode, and description.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <FormField v-slot="{ componentField }" name="name" :form="form">
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter product name" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField v-slot="{ componentField }" name="sku" :form="form">
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="SKU-001" v-bind="componentField" />
                  </FormControl>
                  <FormDescription>Stock Keeping Unit</FormDescription>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="barcode" :form="form">
                <FormItem>
                  <FormLabel>Barcode</FormLabel>
                  <FormControl>
                    <Input placeholder="Barcode" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <FormField v-slot="{ componentField }" name="description" :form="form">
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Product description..."
                    rows="3"
                    v-bind="componentField"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </CardContent>
        </Card>

        <Card v-if="activeStep === 2">
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Set selling price, cost price, and tax.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField v-slot="{ componentField }" name="sellingPrice" :form="form">
                <FormItem>
                  <FormLabel>Selling Price *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" step="0.01" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="costPrice" :form="form">
                <FormItem>
                  <FormLabel>Cost Price *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" step="0.01" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <FormField v-slot="{ componentField }" name="taxId" :form="form">
              <FormItem>
                <FormLabel>Tax</FormLabel>
                <Select v-bind="componentField">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Tax" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem v-for="t in taxesData" :key="t.id" :value="t.id">
                      {{ t.name }} ({{ t.rate }}%)
                    </SelectItem>
                  </SelectContent>
                  <FormDescription v-if="!taxesData?.length">No taxes available</FormDescription>
                </Select>
              </FormItem>
            </FormField>
          </CardContent>
        </Card>

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
                    <Input type="number" placeholder="0" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="lowStockThreshold" :form="form">
                <FormItem>
                  <FormLabel>Low Stock Threshold</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </div>

            <FormField v-slot="{ componentField }" name="unitId" :form="form">
              <FormItem>
                <FormLabel>Unit *</FormLabel>
                <Select v-bind="componentField">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem v-for="u in unitsData" :key="u.id" :value="u.id">
                      {{ u.name }} ({{ u.abbreviation }})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="categoryId" :form="form">
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select v-bind="componentField">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
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

            <FormField v-slot="{ componentField }" name="brandId" :form="form">
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select v-bind="componentField">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Brand" />
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

        <Card v-if="activeStep === 4">
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              Upload product images. Drag & drop multiple images or click to browse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploader
              :max-files="10"
              @upload="handleFilesAdded"
            />
            <div
              v-if="uploadedImages.length > 0"
              class="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3"
            >
              <div
                v-for="(url, index) in uploadedImages"
                :key="index"
                class="relative group"
              >
                <img
                  :src="url"
                  :alt="`Product image ${index + 1}`"
                  class="aspect-square object-cover rounded-lg border border-border"
                />
                <button
                  @click="removeImage(index)"
                  class="absolute top-1 right-1 p-0.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <X class="w-3 h-3" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card v-if="activeStep === 5">
          <CardHeader>
            <CardTitle>Review & Confirm</CardTitle>
            <CardDescription>Please review all details before saving.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 class="text-xs font-medium text-muted-foreground uppercase">General</h3>
                <dl class="space-y-1 mt-1">
                  <div>
                    <dt class="text-xs text-muted-foreground">Name</dt>
                    <dd class="text-sm">{{ form.values.name }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-muted-foreground">SKU</dt>
                    <dd class="text-sm font-mono">{{ form.values.sku || '—' }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-muted-foreground">Barcode</dt>
                    <dd class="text-sm font-mono">{{ form.values.barcode || '—' }}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 class="text-xs font-medium text-muted-foreground uppercase">Pricing & Stock</h3>
                <dl class="space-y-1 mt-1">
                  <div>
                    <dt class="text-xs text-muted-foreground">Selling Price</dt>
                    <dd class="text-sm font-mono">
                      {{ form.values.sellingPrice?.toLocaleString('en-KE', { style: 'currency', currency: 'KES' }) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-muted-foreground">Cost Price</dt>
                    <dd class="text-sm font-mono">
                      {{ form.values.costPrice?.toLocaleString('en-KE', { style: 'currency', currency: 'KES' }) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-muted-foreground">Stock</dt>
                    <dd class="text-sm">{{ form.values.stockQuantity }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-muted-foreground">Images</dt>
                    <dd class="text-sm">{{ uploadedImages.length }} selected</dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Form>

    <div class="flex justify-between mt-6">
      <Button
        v-if="activeStep > 1"
        variant="outline"
        @click="prevStep"
      >
        <ChevronLeft class="w-4 h-4 mr-1" />
        Back
      </Button>
      <div class="flex gap-2">
        <Button variant="outline" @click="goToProducts">
          Cancel
        </Button>
        <Button
          v-if="activeStep < steps.length"
          @click="nextStep"
        >
          Continue
          <ChevronRight class="w-4 h-4 ml-1" />
        </Button>
        <Button
          v-else
          :disabled="saveMutation.isPending ? true : false"
          @click="handleSubmit"
        >
          <Save class="w-4 h-4 mr-2" v-if="!saveMutation.isPending" />
          {{ saveMutation.isPending ? 'Saving...' : (isEditing ? 'Update Product' : 'Save Product') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.2s ease-in-out;
}
.slide-fade-leave-active {
  transition: all 0.2s ease-in-out;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}
</style>
