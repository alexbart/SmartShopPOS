<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Category, Unit, Brand, Tax } from '@/shared/types';

const router = useRouter();
const queryClient = useQueryClient();
const submitting = ref(false);

const form = reactive({
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
  weight: '',
  dimensions: { length: '', width: '', height: '' },
  fulfillment: 'manual',
});

const variantAttributes = ref<{ name: string; values: string[] }[]>([
  { name: 'Size', values: ['S', 'M', 'L'] },
  { name: 'Color', values: ['Red', 'Blue', 'Green'] },
]);

const variantMatrix = ref<
  Array<{
    sku: string;
    price: number;
    cost: number;
    stock: number;
    attributes: Record<string, string>;
  }>
>([]);

const uploadedImages = ref<string[]>([]);

const { data: categoriesData } = useQuery({
  queryKey: ['categories'],
  queryFn: async () => {
    const res = await apiClient.get('/categories');
    return res.data.data.items as Category[];
  },
});

const { data: unitsData } = useQuery({
  queryKey: ['units'],
  queryFn: async () => {
    const res = await apiClient.get('/units');
    return res.data.data.items as Unit[];
  },
});

const { data: brandsData } = useQuery({
  queryKey: ['brands'],
  queryFn: async () => {
    const res = await apiClient.get('/brands');
    return res.data.data.items as Brand[];
  },
});

const { data: taxesData } = useQuery({
  queryKey: ['taxes'],
  queryFn: async () => {
    const res = await apiClient.get('/taxes');
    return res.data.data.items as Tax[];
  },
});

const categories = computed(() => categoriesData.value ?? []);
const units = computed(() => unitsData.value ?? []);
const brands = computed(() => brandsData.value ?? []);
const taxes = computed(() => taxesData.value ?? []);

const saveMutation = useMutation({
  mutationFn: (payload: any) => apiClient.post('/products', payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    notification.success('Product created', form.name);
    router.push('/products');
  },
});

function generateVariantMatrix() {
  const combinations: Record<string, string>[] = [];
  function backtrack(index: number, current: Record<string, string>) {
    if (index === variantAttributes.value.length) {
      combinations.push({ ...current });
      return;
    }
    for (const value of variantAttributes.value[index].values) {
      current[variantAttributes.value[index].name] = value;
      backtrack(index + 1, current);
      delete current[variantAttributes.value[index].name];
    }
  }
  backtrack(0, {});

  variantMatrix.value = combinations.map((attrs) => ({
    sku: form.sku || '',
    price: form.sellingPrice,
    cost: form.costPrice,
    stock: form.stockQuantity,
    attributes: attrs,
  }));
}

function handleImageUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files) {
    for (const file of Array.from(input.files)) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        uploadedImages.value.push(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }
}

async function handleSubmit() {
  if (!form.name || !form.unitId) {
    notification.error('Please fill in required fields');
    return;
  }

  submitting.value = true;
  try {
    await saveMutation.mutateAsync({
      name: form.name,
      code: form.code || undefined,
      sku: form.sku || undefined,
      barcode: form.barcode || undefined,
      description: form.description || undefined,
      sellingPrice: Number(form.sellingPrice),
      costPrice: Number(form.costPrice),
      stockQuantity: Number(form.stockQuantity),
      lowStockThreshold: Number(form.lowStockThreshold),
      unitId: form.unitId,
      categoryId: form.categoryId || undefined,
      brandId: form.brandId || undefined,
      taxId: form.taxId || undefined,
      isActive: form.isActive,
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold">Create Product</h1>
        <p class="text-sm text-muted-foreground mt-1">Add a new product to your catalog</p>
      </div>
      <div class="flex gap-2">
        <button @click="router.push('/products')" class="btn btn-outline">Cancel</button>
        <button
          @click="handleSubmit"
          :disabled="submitting"
          class="btn btn-primary"
        >
          {{ submitting ? 'Saving...' : 'Save Product' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-6">
        <div class="card p-6">
          <h2 class="font-bold text-lg mb-4">General Information</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input v-model="form.name" type="text" placeholder="Enter product name" class="input" required />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input v-model="form.sku" type="text" placeholder="SKU-001" class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input v-model="form.barcode" type="text" placeholder="Barcode" class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
              <input v-model.number="form.sellingPrice" type="number" placeholder="0.00" class="input" required step="0.01" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Cost Price *</label>
              <input v-model.number="form.costPrice" type="number" placeholder="0.00" class="input" required step="0.01" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input v-model.number="form.stockQuantity" type="number" class="input" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
              <input v-model.number="form.lowStockThreshold" type="number" class="input" />
            </div>

            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea v-model="form.description" placeholder="Product description..." class="input" rows="3"></textarea>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="font-bold text-lg mb-4">Media</h2>
          <div
            class="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            @click="handleImageUpload"
          >
            <input
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="handleImageUpload"
            />
            <svg class="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 9a2 2 0 012-2h.5a4 4 0 014 4v5a2 2 0 002 2h5a2 2 0 000-4V9a2 2 0 012-2h2" />
            </svg>
            <p class="text-sm text-muted-foreground">Drag & drop images, or click to upload</p>
          </div>

          <div v-if="uploadedImages.length" class="grid grid-cols-4 gap-2 mt-4">
            <div
              v-for="(img, i) in uploadedImages"
              :key="i"
              class="aspect-square rounded-md overflow-hidden border border-border"
            >
              <img :src="img" :alt="`product-${i}`" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-bold text-lg">Variant Matrix</h2>
            <button
              @click="generateVariantMatrix()"
              class="btn btn-outline btn-sm"
              :disabled="!variantAttributes.length"
            >
              Generate
            </button>
          </div>

          <div v-if="!variantAttributes.length" class="text-center py-6 text-muted-foreground">
            <p>No variant attributes defined.</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(attr, aIndex) in variantAttributes"
              :key="aIndex"
              class="border border-border rounded-lg p-3"
            >
              <div class="flex gap-2 items-center mb-2">
                <input v-model="attr.name" type="text" placeholder="Attribute name" class="input flex-1" />
                <button
                  @click="variantAttributes.splice(aIndex, 1)"
                  class="text-red-500 touch-target"
                  title="Remove"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div class="flex flex-wrap gap-1">
                <span
                  v-for="(val, vIndex) in attr.values"
                  :key="vIndex"
                  class="px-2 py-1 bg-muted rounded text-sm flex items-center"
                >
                  {{ val }}
                  <button
                    @click="attr.values.splice(vIndex, 1)"
                    class="ml-1 text-xs text-red-500"
                  >
                    ×
                  </button>
                </span>
              </div>

              <div class="flex gap-2 mt-2">
                <input
                  v-model="attr.newValue"
                  type="text"
                  placeholder="Add value..."
                  class="input flex-1"
                  @keypress.enter="attr.values.push(attr.newValue); attr.newValue = '';"
                />
              </div>
            </div>
          </div>

          <div v-if="variantMatrix.length" class="mt-4 overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-muted/50">
                <tr>
                  <th v-for="attr in variantAttributes" :key="attr.name" class="p-2 text-left">
                    {{ attr.name }}
                  </th>
                  <th class="p-2 text-right">SKU</th>
                  <th class="p-2 text-right">Price</th>
                  <th class="p-2 text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(variant, vIndex) in variantMatrix" :key="vIndex" class="border-t">
                  <td v-for="attr in variantAttributes" :key="attr.name" class="p-2">
                    <input v-model="variant.attributes[attr.name]" type="text" class="input input-sm" />
                  </td>
                  <td class="p-2">
                    <input v-model="variant.sku" type="text" class="input input-sm text-right" />
                  </td>
                  <td class="p-2">
                    <input v-model.number="variant.price" type="number" class="input input-sm text-right" />
                  </td>
                  <td class="p-2">
                    <input v-model.number="variant.stock" type="number" class="input input-sm text-right" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card p-6">
          <h2 class="font-bold text-lg mb-4">Status</h2>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.isActive"
                type="checkbox"
                class="h-4 w-4 text-primary focus:ring-primary rounded"
              />
              <span class="text-sm">Publish product (visible on sales channels)</span>
            </label>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="font-bold text-lg mb-4">Organization</h2>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select v-model="form.categoryId" class="input" required>
                <option value="">Select Category</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select v-model="form.brandId" class="input">
                <option value="">Select Brand</option>
                <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <select v-model="form.unitId" class="input" required>
                <option value="">Select Unit</option>
                <option v-for="u in units" :key="u.id" :value="u.id">{{ u.name }} ({{ u.abbreviation }})</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tax</label>
              <select v-model="form.taxId" class="input">
                <option value="">Select Tax</option>
                <option v-for="t in taxes" :key="t.id" :value="t.id">{{ t.name }} ({{ t.rate }}%)</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="font-bold text-lg mb-4">Shipping &amp; Logistics</h2>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input v-model.number="form.weight" type="number" placeholder="0.00" class="input" step="0.01" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
              <div class="grid grid-cols-3 gap-2">
                <input v-model.number="form.dimensions.length" type="number" placeholder="L" class="input input-sm" step="0.01" />
                <input v-model.number="form.dimensions.width" type="number" placeholder="W" class="input input-sm" step="0.01" />
                <input v-model.number="form.dimensions.height" type="number" placeholder="H" class="input input-sm" step="0.01" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fulfillment</label>
              <select v-model="form.fulfillment" class="input">
                <option value="manual">Manual Fulfillment</option>
                <option value="digital">Digital Delivery</option>
                <option value="pickup">Store Pickup</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
