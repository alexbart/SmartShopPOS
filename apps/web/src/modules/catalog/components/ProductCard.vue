<script setup lang="ts">
import {
  Eye,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  Package,
  Archive,
} from '@lucide/vue';
import type { Product } from '@/shared/types';
import ProductAvatar from '@/modules/catalog/components/ProductAvatar.vue';
import StockBadge from '@/modules/catalog/components/StockBadge.vue';
import StatusChip from '@/modules/catalog/components/StatusChip.vue';
import PriceTag from '@/modules/catalog/components/PriceTag.vue';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const props = defineProps<{
  product: Product;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}>();

const emit = defineEmits<{
  (e: 'view', product: Product): void;
  (e: 'preview', product: Product): void;
  (e: 'edit', product: Product): void;
  (e: 'delete', product: Product): void;
  (e: 'duplicate', product: Product): void;
  (e: 'archive', product: Product): void;
  (e: 'adjust-stock', product: Product): void;
}>();

function getCategoryName(): string {
  if (props.product.categoryName) return props.product.categoryName;
  const cat = props.categories?.find((c) => c.id === props.product.categoryId);
  return cat?.name || 'Uncategorized';
}

function getBrandName(): string {
  if (props.product.brandName) return props.product.brandName;
  const b = props.brands?.find((b) => b.id === props.product.brandId);
  return b?.name || '';
}
</script>

<template>
  <Card
    class="cursor-pointer transition-all duration-200 hover:shadow-md group relative"
    @click.stop="$emit('view', product)"
  >
    <CardContent class="p-4">
      <div class="flex items-start gap-3">
        <ProductAvatar
          :src="product.imageUrl"
          :alt="product.name"
          size="md"
        />

        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm">{{ product.name }}</p>
              <p class="text-xs text-muted-foreground font-mono">
                SKU: {{ product.code || product.sku || '—' }}
              </p>
              <p
                v-if="getBrandName()"
                class="text-xs text-muted-foreground/70"
              >
                {{ getBrandName() }}
              </p>
            </div>
            <StatusChip
              :status="product.isActive ? 'active' : 'inactive'"
              text=""
              size="sm"
              class="ml-auto"
            />
          </div>

          <div class="mt-2 space-y-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger as-child>
                  <div class="flex items-center justify-between cursor-help">
                    <PriceTag :amount="product.sellingPrice" size="sm" />
                    <StockBadge
                      :quantity="product.stockQuantity ?? 0"
                      :threshold="product.lowStockThreshold"
                      size="sm"
                      :show-text="false"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" class="text-xs">
                  <p v-if="product.stockQuantity <= (product.lowStockThreshold ?? 0)">
                    Low Stock
                  </p>
                  <p v-else>In Stock</p>
                  <p>Current: {{ product.stockQuantity }}</p>
                  <p>Cost: KES {{ product.costPrice }}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <p class="text-xs text-muted-foreground">
            Category: {{ getCategoryName() }}
          </p>
        </div>
      </div>
    </CardContent>

    <div
      class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity no-row-click"
      @click.stop
    >
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon-sm" class="h-7 w-7 touch-target">
            <MoreVertical class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-44">
          <DropdownMenuItem @click.stop="$emit('view', product)">
            View Detail
          </DropdownMenuItem>
          <DropdownMenuItem @click.stop="emit('preview', product)">
            <Eye class="h-4 w-4 mr-2" />
            Quick Preview
          </DropdownMenuItem>
          <DropdownMenuItem @click.stop="$emit('edit', product)">
            <Edit class="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem @click.stop="$emit('duplicate', product)">
            <Copy class="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem @click.stop="$emit('adjust-stock', product)">
            <Package class="h-4 w-4 mr-2" />
            Adjust Stock
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click.stop="$emit('archive', product)">
            <Archive class="h-4 w-4 mr-2" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuItem
            @click.stop="$emit('delete', product)"
            class="text-destructive focus:text-destructive"
          >
            <Trash2 class="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </Card>
</template>
