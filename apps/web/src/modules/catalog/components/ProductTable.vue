<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Copy,
  Archive,
  Package,
} from '@lucide/vue';
import type { Product, Category, Brand } from '@/shared/types';
import StockBadge from '@/modules/catalog/components/StockBadge.vue';
import ProductAvatar from '@/modules/catalog/components/ProductAvatar.vue';
import StatusChip from '@/modules/catalog/components/StatusChip.vue';
import PriceTag from '@/modules/catalog/components/PriceTag.vue';
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
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  selectedIds: string[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selectedIds: () => [],
  isLoading: false,
});

const emit = defineEmits<{
  (e: 'select-all', checked: boolean): void;
  (e: 'select-product', id: string, checked: boolean): void;
  (e: 'view', product: Product): void;
  (e: 'preview', product: Product): void;
  (e: 'edit', product: Product): void;
  (e: 'delete', product: Product): void;
  (e: 'duplicate', product: Product): void;
  (e: 'archive', product: Product): void;
  (e: 'adjust-stock', product: Product): void;
  (e: 'row-dblclick', product: Product): void;
}>();

const categoryNameMap = computed(() =>
  new Map(props.categories.map((c) => [c.id, c.name])),
);

const brandNameMap = computed(() =>
  new Map(props.brands.map((b) => [b.id, b.name])),
);

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

const contextMenuProduct = ref<Product | null>(null);
const selectedRowIndex = ref(0);

onMounted(() => {
  const tableEl = document.querySelector<HTMLElement>('.product-table');
  if (!tableEl) return;

  const handler = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLElement &&
        (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

    const rows = tableEl.querySelectorAll('tbody tr');
    if (rows.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedRowIndex.value = Math.min(selectedRowIndex.value + 1, rows.length - 1);
      const el = rows[selectedRowIndex.value] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedRowIndex.value = Math.max(selectedRowIndex.value - 1, 0);
      const el = rows[selectedRowIndex.value] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const product = props.products[selectedRowIndex.value];
      if (product) emit('view', product);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      const product = props.products[selectedRowIndex.value];
      if (product && props.selectedIds.length === 0) {
        emit('preview', product);
      }
    }
  };

  tableEl.addEventListener('keydown', handler);
  onUnmounted(() => tableEl.removeEventListener('keydown', handler));
});
</script>

<template>
    <div class="overflow-x-auto rounded-lg border border-border bg-card product-table" tabindex="0">
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead class="w-8">
            <Checkbox
              :model-value="props.selectedIds.length === props.products.length && props.products.length > 0"
              :indeterminate="
                props.selectedIds.length > 0 &&
                props.selectedIds.length < props.products.length
              "
              @update:modelValue="
                (checked: boolean | 'indeterminate') =>
                  emit('select-all', checked as boolean)
              "
              aria-label="Select all products"
              class="translate-y-0.5 no-row-click"
            />
          </TableHead>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Category</TableHead>
          <TableHead class="text-right">Stock</TableHead>
          <TableHead class="text-right">Price</TableHead>
          <TableHead class="text-center">Status</TableHead>
          <TableHead class="w-[54px] text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="product in products"
          :key="product.id"
          class="group hover:bg-muted/50 transition-colors cursor-pointer"
          @dblclick="emit('row-dblclick', product)"
          @contextmenu="
            (e: MouseEvent) => {
              e.preventDefault();
              contextMenuProduct = product;
            }
          "
        >
          <TableCell class="no-row-click">
            <Checkbox
              :model-value="props.selectedIds.includes(product.id)"
              @update:modelValue="
                (checked: boolean | 'indeterminate') =>
                  emit('select-product', product.id, checked as boolean)
              "
              aria-label="Select product"
              class="translate-y-0.5"
            />
          </TableCell>

          <TableCell>
            <div class="flex items-center gap-3">
              <ProductAvatar
                :src="product.imageUrl"
                :alt="product.name"
                size="md"
              />
              <div>
                <p class="font-medium text-sm">{{ product.name }}</p>
                <p
                  v-if="product.description"
                  class="text-xs text-muted-foreground/70 mt-0.5 max-w-[180px] truncate"
                >
                  {{ product.description.substring(0, 40) }}
                </p>
                <p
                  v-if="getBrandName(product)"
                  class="text-xs text-muted-foreground/70"
                >
                  by {{ getBrandName(product) }}
                </p>
              </div>
            </div>
          </TableCell>

          <TableCell>
            <p class="text-sm font-mono text-muted-foreground">
              {{ product.code || product.sku || '—' }}
            </p>
            <p
              v-if="product.sku && product.code !== product.sku"
              class="text-xs text-muted-foreground/70 font-mono"
            >
              {{ product.sku }}
            </p>
          </TableCell>

          <TableCell>
            <p class="text-sm text-muted-foreground">
              {{ getCategoryName(product) }}
            </p>
          </TableCell>

          <TableCell class="text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <div class="flex justify-end cursor-help">
                    <StockBadge
                      :quantity="product.stockQuantity ?? 0"
                      :threshold="product.lowStockThreshold"
                      size="sm"
                      :show-text="false"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>
                    {{ product.stockQuantity <= (product.lowStockThreshold ?? 0)
                      ? 'Low Stock'
                      : 'In Stock' }}
                  </p>
                  <p>Threshold: {{ product.lowStockThreshold ?? 0 }}</p>
                  <p>Current: {{ product.stockQuantity }}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableCell>

          <TableCell class="text-right">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <div class="cursor-help">
                    <PriceTag :amount="product.sellingPrice" size="sm" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p>Cost: KES {{ product.costPrice }}</p>
                  <p>Margin: {{ product.sellingPrice > 0
                    ? (((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(1)
                    : '0' }}%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TableCell>

          <TableCell class="text-center">
            <StatusChip
              :status="product.isActive ? 'active' : 'inactive'"
              size="sm"
            />
          </TableCell>

          <TableCell class="no-row-click">
            <div class="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    class="h-7 w-7"
                  >
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-44">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="emit('preview', product)">
                    <Eye class="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="emit('view', product)">
                    <Eye class="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="emit('edit', product)">
                    <Edit class="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="emit('duplicate', product)">
                    <Copy class="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="emit('adjust-stock', product)">
                    <Package class="h-4 w-4 mr-2" />
                    Adjust Stock
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="emit('archive', product)">
                    <Archive class="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    @click="emit('delete', product)"
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

        <TableRow v-if="!products.length && !isLoading">
          <TableCell :colspan="8" class="h-24 text-center">
            <p class="text-sm text-muted-foreground">No products found.</p>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
