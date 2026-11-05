<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Customer, CustomerQuery } from '../composables/useCustomers';
import { Search, MoreVertical, Edit, Eye, Trash2 } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Props {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  query: CustomerQuery;
}

interface Emits {
  (e: 'update:query', query: CustomerQuery): void;
  (e: 'view', customer: Customer): void;
  (e: 'edit', customer: Customer): void;
  (e: 'delete', customer: Customer): void;
}

const props = withDefaults(defineProps<Props>(), {
  customers: () => [],
  total: 0,
  page: 1,
  limit: 20,
  loading: false,
  query: () => ({ organizationId: '', page: 1, limit: 20 }),
});

const emit = defineEmits<Emits>();

const localSearch = ref(props.query.search || '');
const localActive = ref<boolean | undefined>(props.query.active);

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const totalPages = computed(() => Math.ceil(props.total / props.limit) || 1);

function updateSearch(value: string) {
  localSearch.value = value;
  emit('update:query', { ...props.query, search: value || undefined, page: 1 });
}

function updateActive(value: unknown) {
  const selected = String(value);
  const active = selected === 'all' ? undefined : selected === 'active';
  localActive.value = active;
  emit('update:query', { ...props.query, active, page: 1 });
}

function handleSort(by: string) {
  const newOrder = props.query.sortBy === by && props.query.sortOrder === 'asc' ? 'desc' : 'asc';
  emit('update:query', { ...props.query, sortBy: by, sortOrder: newOrder, page: 1 });
}

function changePage(newPage: number) {
  if (newPage < 1 || newPage > totalPages.value) return;
  emit('update:query', { ...props.query, page: newPage });
}

function handleView(customer: Customer) {
  emit('view', customer);
}

function handleEdit(customer: Customer) {
  emit('edit', customer);
}

function handleDelete(customer: Customer) {
  emit('delete', customer);
}
</script>

<template>
  <Card>
    <CardContent class="p-0">
      <!-- Search & Filter Bar -->
      <div class="flex flex-col sm:flex-row gap-4 p-4 border-b">
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            v-model="localSearch"
            type="search"
            placeholder="Search name, phone, code..."
            class="pl-10"
            @input="updateSearch($event.target.value)"
          />
        </div>
        <Select :model-value="localActive === undefined ? 'all' : localActive ? 'active' : 'inactive'" @update:modelValue="updateActive">
          <SelectTrigger class="w-full sm:w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow class="hover:bg-transparent">
              <TableHead class="w-8"></TableHead>
              <TableHead class="cursor-pointer select-none" @click="handleSort('name')">
                <div class="flex items-center gap-1">
                  Name
                  <span v-if="props.query.sortBy === 'name'">
                    {{ props.query.sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
              </TableHead>
              <TableHead class="cursor-pointer select-none" @click="handleSort('code')">
                <div class="flex items-center gap-1">
                  Code
                  <span v-if="props.query.sortBy === 'code'">
                    {{ props.query.sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
              </TableHead>
              <TableHead class="cursor-pointer select-none" @click="handleSort('phone')">
                <div class="flex items-center gap-1">
                  Phone
                  <span v-if="props.query.sortBy === 'phone'">
                    {{ props.query.sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
              </TableHead>
              <TableHead class="cursor-pointer select-none" @click="handleSort('email')">
                <div class="flex items-center gap-1">
                  Email
                  <span v-if="props.query.sortBy === 'email'">
                    {{ props.query.sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
              </TableHead>
              <TableHead class="cursor-pointer select-none" @click="handleSort('isActive')">
                <div class="flex items-center gap-1">
                  Status
                  <span v-if="props.query.sortBy === 'isActive'">
                    {{ props.query.sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
              </TableHead>
              <TableHead class="cursor-pointer select-none" @click="handleSort('createdAt')">
                <div class="flex items-center gap-1">
                  Created
                  <span v-if="props.query.sortBy === 'createdAt'">
                    {{ props.query.sortOrder === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
              </TableHead>
              <TableHead class="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody v-if="!loading">
            <TableRow v-for="customer in customers" :key="customer.id" class="hover:bg-accent/50 transition-colors">
              <TableCell class="w-8">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <MoreVertical class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-48">
                    <DropdownMenuItem @click="handleView(customer)">
                      <Eye class="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="handleEdit(customer)">
                      <Edit class="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="handleDelete(customer)" class="text-destructive focus:text-destructive">
                      <Trash2 class="h-4 w-4 mr-2" />
                      Deactivate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell class="font-medium">{{ customer.name }}</TableCell>
              <TableCell>{{ customer.code }}</TableCell>
              <TableCell>{{ customer.phone || '—' }}</TableCell>
              <TableCell>{{ customer.email || '—' }}</TableCell>
              <TableCell>
                <Badge :variant="customer.isActive ? 'default' : 'secondary'">
                  {{ customer.isActive ? 'Active' : 'Inactive' }}
                </Badge>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ new Date(customer.createdAt).toLocaleDateString() }}
              </TableCell>
              <TableCell class="w-24 text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" class="h-7 w-7" @click="handleView(customer)" title="View">
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-7 w-7" @click="handleEdit(customer)" title="Edit">
                    <Edit class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-7 w-7 text-destructive hover:text-destructive" @click="handleDelete(customer)" title="Deactivate">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>

          <TableBody v-else-if="loading">
            <TableRow>
              <TableCell colSpan="8" class="text-center py-12">
                <div class="flex items-center justify-center gap-2">
                  <div class="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                  <span class="text-muted-foreground">Loading customers...</span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>

          <TableBody v-else>
            <TableRow>
              <TableCell colSpan="8" class="text-center py-12">
                <div class="flex flex-col items-center gap-2">
                  <p class="text-lg font-medium">No customers found</p>
                  <p class="text-sm text-muted-foreground">Try adjusting your search or filters</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <!-- Pagination -->
        <div class="flex items-center justify-between p-4 border-t" v-if="totalPages > 1">
          <div class="text-sm text-muted-foreground">
            Page {{ page }} of {{ totalPages }} · {{ total }} customers
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" :disabled="page <= 1" @click="changePage(page - 1)">
              Previous
            </Button>
            <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="changePage(page + 1)">
              Next
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
