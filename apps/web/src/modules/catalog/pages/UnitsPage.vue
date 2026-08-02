<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { useRouter } from 'vue-router';
import { Plus, Trash2, Box, ChevronLeft, ChevronRight } from '@lucide/vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Unit } from '@/shared/types';
import CatalogWorkspace from '@/modules/catalog/components/CatalogWorkspace.vue';
import SmartSearch from '@/components/business/SmartSearch.vue';
import ErrorState from '@/components/business/ErrorState.vue';
import LoadingSkeleton from '@/components/business/LoadingSkeleton.vue';
import EmptyState from '@/components/business/EmptyState.vue';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const queryClient = useQueryClient();
const router = useRouter();
const searchRef = ref<any>(null);

const searchQuery = ref('');
const currentPage = ref(1);
const dialogOpen = ref(false);
const newName = ref('');
const newCode = ref('');
const newAbbreviation = ref('');

const { data: unitsResponse, isLoading, isError, refetch } = useQuery({
  queryKey: ['units', { search: searchQuery, page: currentPage }],
  queryFn: async () => {
    const params: Record<string, string> = {};
    if (searchQuery.value) params.search = searchQuery.value;
    params.page = String(currentPage.value);
    params.limit = '20';
    const response = await apiClient.get('/units', { params });
    return response.data.data;
  },
});

const units = computed(() => unitsResponse.value?.items ?? []);
const totalUnits = computed(() => unitsResponse.value?.total ?? 0);
const totalPages = computed(() => unitsResponse.value?.pages ?? 1);

function handleSearch(query: string) {
  searchQuery.value = query;
  currentPage.value = 1;
}

function handleDelete(unit: Unit) {
  if (confirm(`Delete "${unit.name}"?`)) {
    apiClient.delete(`/units/${unit.id}`)
      .then(() => {
        notification.success('Unit deleted', unit.name);
        queryClient.invalidateQueries({ queryKey: ['units'] });
      })
      .catch(() => {});
  }
}

async function handleCreate() {
  if (!newName.value || !newCode.value) {
    notification.error('Please fill in required fields');
    return;
  }
  try {
    await apiClient.post('/units', {
      name: newName.value,
      code: newCode.value,
      abbreviation: newAbbreviation.value,
      isActive: true,
    });
    notification.success('Unit created', newName.value);
    dialogOpen.value = false;
    queryClient.invalidateQueries({ queryKey: ['units'] });
    resetForm();
  } catch (e) {
    notification.error('Failed to create unit');
  }
}

function resetForm() {
  newName.value = '';
  newCode.value = '';
  newAbbreviation.value = '';
}

function handleFocusSearch() {
  searchRef.value?.querySelector('input')?.focus();
}
</script>

<template>
  <CatalogWorkspace
    title="Units"
    description="Manage measurement units"
    :breadcrumbs="[{ label: 'Catalog', href: '/products' }]"
    :workspace-icon="Box"
    :action-button="{
      label: 'New Unit',
      icon: Plus,
      onClick: () => (dialogOpen = true),
    }"
    :tabs="[
      { label: 'Products', value: 'products' },
      { label: 'Categories', value: 'categories' },
      { label: 'Brands', value: 'brands' },
      { label: 'Units', value: 'units' },
      { label: 'Taxes', value: 'taxes' },
    ]"
    :active-tab="'units'"
    @update:activeTab="
      (v) => router.push(v === 'products' ? '/products' : v === 'categories' ? '/categories' : v === 'brands' ? '/brands' : v === 'taxes' ? '/taxes' : '/products')
    "
    @focus-search="handleFocusSearch"
    :show-toolbar="true"
  >
    <template #toolbar>
      <div ref="searchRef">
        <SmartSearch
          v-model="searchQuery"
          placeholder="Search units..."
          @search="handleSearch"
        />
      </div>
    </template>

    <div class="animate-fadeIn">
      <Card>
        <CardContent class="p-0">
          <div v-if="isError" class="p-6">
            <ErrorState title="Failed to load units" retryable @retry="refetch" />
          </div>

          <div v-else-if="isLoading" class="p-4">
            <LoadingSkeleton :rows="5" />
          </div>

          <div v-else-if="!units.length" class="p-6">
            <EmptyState
              icon="Box"
              title="No units found"
              description="No units match your search. Create a new unit to get started."
            >
              <Button @click="dialogOpen = true">
                <Plus class="w-4 h-4 mr-2" />
                New Unit
              </Button>
            </EmptyState>
          </div>

          <div v-else class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead class="text-center">Abbreviation</TableHead>
                  <TableHead class="text-center">Status</TableHead>
                  <TableHead class="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="unit in units" :key="unit.id">
                  <TableCell>
                    <span class="font-medium">{{ unit.name }}</span>
                  </TableCell>
                  <TableCell>
                    <span class="font-mono text-sm">{{ unit.code }}</span>
                  </TableCell>
                  <TableCell class="text-center">
                    <span class="font-mono text-sm">{{ unit.abbreviation }}</span>
                  </TableCell>
                  <TableCell class="text-center">
                    <Badge :variant="unit.isActive ? 'default' : 'secondary'">
                      {{ unit.isActive ? 'Active' : 'Inactive' }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-center">
                    <div class="flex justify-center gap-1">
                      <button
                        @click="handleDelete(unit)"
                        class="p-1 hover:bg-red-100 text-red-600 rounded touch-target"
                        title="Delete"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <div
          v-if="totalPages > 1 && units.length > 0"
          class="p-4 border-t flex items-center justify-between"
        >
          <p class="text-sm text-muted-foreground">
            Page {{ currentPage }} of {{ totalPages }} — {{ totalUnits }} total
          </p>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage === 1"
              @click="currentPage > 1 && currentPage--"
            >
            <ChevronLeft class="w-4 h-4" />
            </Button>
            <span class="text-sm">{{ currentPage }} / {{ totalPages }}</span>
            <Button
              variant="outline"
              size="sm"
              :disabled="currentPage >= totalPages"
              @click="currentPage < totalPages && currentPage++"
            >
              <ChevronRight class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <Dialog v-model:open="dialogOpen">
      <DialogTrigger />
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Unit</DialogTitle>
          <DialogDescription>Add a new measurement unit.</DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div>
            <Label>Name *</Label>
            <Input v-model="newName" placeholder="e.g. Kilogram" />
          </div>
          <div>
            <Label>Code *</Label>
            <Input v-model="newCode" placeholder="e.g. KG" />
          </div>
          <div>
            <Label>Abbreviation</Label>
            <Input v-model="newAbbreviation" placeholder="e.g. kg" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="resetForm; dialogOpen = false">Cancel</Button>
          <Button @click="handleCreate">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </CatalogWorkspace>
</template>
