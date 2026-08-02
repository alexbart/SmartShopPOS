<script setup lang="ts">
import { computed } from 'vue';
import { Edit, Trash2, MoreHorizontal, Eye } from '@lucide/vue';
import type { Product, Category, Brand } from '@/shared/types';
import StockStatusBadge from '@/components/business/StockStatusBadge.vue';
import ProductImage from '@/components/business/ProductImage.vue';
import StatusBadge from '@/components/business/StatusBadge.vue';
import MoneyDisplay from '@/components/business/MoneyDisplay.vue';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  selectedIds: string[];
  isLoading?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onView?: (product: Product) => void;
}

const props = withDefaults(defineProps<Props>(), {
  selectedIds: () => [],
  isLoading: false,
  onEdit: undefined,
  onDelete: undefined,
  onView: undefined,
});

const emit = defineEmits<{
  (e: 'select-all', checked: boolean): void;
  (e: 'select-product', id: string, checked: boolean): void;
  (e: 'select-all-change', ids: string[]): void;
}>();

const categoryNameMap = computed(() => {
  return new Map(props.categories.map((c) => [c.id, c.name]));
});

const brandNameMap = computed(() => {
  return new Map(props.brands.map((b) => [b.id, b.name]));
});

function getCategoryName(product: Product): string {
  if (product.categoryName) return product.categoryName;
  if (product.categoryId) {
    return categoryNameMap.value.get(product.categoryId) || 'Uncategorized';
  }
  return 'Uncategorized';
}

function getBrandName(product: Product): string {
  if (product.brandName) return product.brandName;
  if (product.brandId) {
    return brandNameMap.value.get(product.brandId) || '';
  }
  return '';
}

function getStockStatus(product: Product): number {
  return product.stockQuantity ?? 0;
}
</script>

<template>
  <div class="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-8">
            <Checkbox
              :model-value="props.selectedIds.length === props.products.length && props.products.length > 0"
              :indeterminate="props.selectedIds.length > 0 && props.selectedIds.length < props.products.length"
              @update:modelValue="(checked: boolean | 'indeterminate') => emit('select-all', checked as boolean)"
              aria-label="Select all"
              class="translate-y-0.5 no-row-click"
            />
          </TableHead>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead class="text-right">Price</TableHead>
          <TableHead class="text-right">Stock</TableHead>
          <TableHead class="text-center">Status</TableHead>
          <TableHead class="w-[70px] text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="product in products"
          :key="product.id"
          class="group hover:bg-muted/50"
        >
          <TableCell class="no-row-click">
            <Checkbox
              :model-value="props.selectedIds.includes(product.id)"
              @update:modelValue="(checked: boolean | 'indeterminate') => emit('select-product', product.id, checked as boolean)"
              aria-label="Select product"
              class="translate-y-0.5"
            />
          </TableCell>
          <TableCell>
            <div class="flex items-center gap-3">
              <ProductImage :src="product.imageUrl" :alt="product.name" size="md" />
              <div>
                <p class="font-medium text-sm">{{ product.name }}</p>
                <p v-if="product.description" class="text-xs text-muted-foreground mt-0.5 max-w-[180px] truncate">
                  {{ product.description.substring(0, 40) }}
                </p>
              </div>
            </div>
          </TableCell>
          <TableCell>
            <p class="text-sm font-mono">{{ product.code }}</p>
            <p v-if="product.sku" class="text-xs text-muted-foreground font-mono">
              {{ product.sku }}
            </p>
          </TableCell>
          <TableCell>
            <p class="text-sm">{{ getCategoryName(product) }}</p>
          </TableCell>
          <TableCell>
            <p v-if="getBrandName(product)" class="text-sm">{{ getBrandName(product) }}</p>
            <span v-else class="text-xs text-muted-foreground/50">—</span>
          </TableCell>
          <TableCell class="text-right">
            <MoneyDisplay :amount="product.sellingPrice" size="sm" />
          </TableCell>
          <TableCell class="text-right">
            <StockStatusBadge
              :currentStock="getStockStatus(product)"
              :lowStockThreshold="product.lowStockThreshold"
              size="sm"
            />
          </TableCell>
          <TableCell class="text-center">
            <StatusBadge
              :status="product.isActive ? 'active' : 'inactive'"
              :text="product.isActive ? 'Active' : 'Inactive'"
            />
          </TableCell>
          <TableCell class="no-row-click">
            <div class="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <button
                    class="p-1 rounded-lg hover:bg-muted touch-target opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal class="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-40">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="onView && onView(product)">
                    <Eye class="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="onEdit && onEdit(product)">
                    <Edit class="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    @click="onDelete && onDelete(product)"
                    class="text-destructive focus:text-destructive"
                  >
                    <Trash2 class="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableCell>
        </TableRow>

        <TableRow v-if="!products.length">
          <TableCell :colspan="10" class="h-24 text-center">
            <p class="text-sm text-muted-foreground">No products found.</p>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
