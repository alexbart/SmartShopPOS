<script setup lang="ts">
interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  class?: string;
  render?: (row: T) => any;
}

withDefaults(
  defineProps<{
    columns: Column<any>[];
    rows: any[];
    hoverable?: boolean;
    striped?: boolean;
    rowKey?: string;
    selectedRows?: any[];
    onSelectRow?: (row: any) => void;
    onSelectAll?: (selected: boolean) => void;
  }>(),
  {
    hoverable: true,
    striped: false,
    rowKey: 'id',
  },
);

const emit = defineEmits<{
  (e: 'selectRow', row: any): void;
  (e: 'selectRowKey', key: string): void;
  (e: 'select-all', selected: boolean): void;
}>();

function handleRowClick(row: any, event: MouseEvent) {
  if ((event.target as HTMLElement)?.closest('.no-row-click')) {
    return;
  }
  emit('selectRow', row);
}
</script>

<template>
  <div class="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            v-if="selectedRows !== undefined"
            class="w-8"
          >
            <Checkbox
              :checked="selectedRows?.length === rows.length && rows.length > 0"
              :indeterminate="selectedRows?.length > 0 && selectedRows?.length < rows.length"
                    @update:checked="
                      (checked: boolean) => emit('select-all', checked)
                    "
              aria-label="Select all"
              class="translate-y-0.5 no-row-click"
            />
          </TableHead>
          <TableHead
            v-for="col in columns"
            :key="col.key"
            :class="[
              col.align === 'right' && 'text-right',
              col.align === 'center' && 'text-center',
              col.width,
            ]"
          >
            {{ col.label }}
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <TableRow
          v-for="row in rows"
          :key="row[rowKey]"
          :class="{ 'hover:bg-muted/50': hoverable }"
          @click="handleRowClick(row, $event)"
        >
          <TableCell
            v-if="selectedRows !== undefined"
            class="no-row-click"
          >
            <Checkbox
              :value="true"
              :checked="selectedRows?.some(r => r[rowKey] === row[rowKey])"
              @update:checked="(checked: boolean) => {
                if (checked) emit('selectRowKey', row[rowKey]);
              }"
              aria-label="Select row"
              class="translate-y-0.5"
            />
          </TableCell>
          <TableCell
            v-for="col in columns"
            :key="col.key"
            :class="[
              'text-sm',
              col.align === 'right' && 'text-right',
              col.align === 'center' && 'text-center',
              col.class,
            ]"
          >
            <component
              v-if="col.render"
              :is="col.render(row)"
            />
            <template v-else>
              {{ row[col.key] }}
            </template>
          </TableCell>
        </TableRow>

        <TableRow v-if="!rows.length">
          <TableCell
            :colspan="columns.length + (selectedRows !== undefined ? 1 : 0)"
            class="h-24 text-center"
          >
            <EmptyState title="No records found" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>

<script lang="ts" setup>
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/business/EmptyState.vue';
</script>
