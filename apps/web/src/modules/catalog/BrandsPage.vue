<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { Plus, Trash2, ChevronLeft, ChevronRight } from '@lucide/vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Brand } from '@/shared/types';
import WorkspaceShell from '@/components/business/WorkspaceShell.vue';
import SmartSearch from '@/components/business/SmartSearch.vue';
import ErrorState from '@/components/business/ErrorState.vue';
import LoadingSkeleton from '@/components/business/LoadingSkeleton.vue';
import EmptyState from '@/components/business/EmptyState.vue';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const queryClient = useQueryClient();

const searchQuery = ref('');
const currentPage = ref(1);
const dialogOpen = ref(false);
const newBrandName = ref('');
const newBrandCode = ref('');
const newBrandDescription = ref('');
const newBrandWebsite = ref('');

const { data: brandsResponse, isLoading, isError, refetch } = useQuery({
  queryKey: ['brands', { search: searchQuery, page: currentPage }],
  queryFn: async () => {
    const params: Record<string, string> = {};
    if (searchQuery.value) params.search = searchQuery.value;
    params.page = String(currentPage.value);
    params.limit = '20';
    const response = await apiClient.get('/brands', { params });
    return response.data.data;
  },
});

const brands = computed(() => brandsResponse.value?.items ?? []);
const totalBrands = computed(() => brandsResponse.value?.total ?? 0);
const totalPages = computed(() => brandsResponse.value?.pages ?? 1);

function handleSearch(query: string) {
  searchQuery.value = query;
  currentPage.value = 1;
}

function handleDelete(brand: Brand) {
  if (confirm(`Delete "${brand.name}"?`)) {
    apiClient.delete(`/brands/${brand.id}`)
      .then(() => {
        notification.success('Brand deleted', brand.name);
        queryClient.invalidateQueries({ queryKey: ['brands'] });
      })
      .catch(() => {});
  }
}

async function handleCreate() {
  if (!newBrandName.value || !newBrandCode.value) {
    notification.error('Please fill in required fields');
    return;
  }
  try {
    await apiClient.post('/brands', {
      name: newBrandName.value,
      code: newBrandCode.value,
      description: newBrandDescription.value,
      website: newBrandWebsite.value,
      isActive: true,
    });
    notification.success('Brand created', newBrandName.value);
    dialogOpen.value = false;
    queryClient.invalidateQueries({ queryKey: ['brands'] });
    resetForm();
  } catch (e) {
    notification.error('Failed to create brand');
  }
}

function resetForm() {
  newBrandName.value = '';
  newBrandCode.value = '';
  newBrandDescription.value = '';
  newBrandWebsite.value = '';
}
</script>

<template>
  <WorkspaceShell
    workspace-icon="Layers"
    workspace-title="Brands"
    workspace-description="Manage product brands"
    :action-button="{
      label: 'New Brand',
      icon: Plus,
      onClick: () => (dialogOpen = true),
    }"
    :tabs="[]"
    :show-toolbar="false"
  >
    <div class="animate-fadeIn">
    <Card class="mb-4">
      <CardContent class="pt-4">
        <SmartSearch
          v-model="searchQuery"
          placeholder="Search brands..."
          @search="handleSearch"
        />
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-0">
        <div v-if="isError" class="p-6">
          <ErrorState title="Failed to load brands" retryable @retry="refetch" />
        </div>
        <div v-else-if="isLoading" class="p-4">
          <LoadingSkeleton :rows="5" />
        </div>
        <div v-else-if="!brands.length" class="p-6">
          <EmptyState title="No brands found" />
        </div>
        <div v-else class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead class="text-center">Status</TableHead>
                <TableHead class="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="brand in brands" :key="brand.id">
                <TableCell>
                  <div class="flex items-center gap-2">
                    <div v-if="brand.logoUrl" class="w-8 h-8 rounded overflow-hidden">
                      <img :src="brand.logoUrl" :alt="brand.name" class="w-full h-full object-cover" />
                    </div>
                    <span class="font-medium">{{ brand.name }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span class="font-mono text-sm">{{ brand.code }}</span>
                </TableCell>
                <TableCell class="text-center">
                  <Badge :variant="brand.isActive ? 'default' : 'secondary'">
                    {{ brand.isActive ? 'Active' : 'Inactive' }}
                  </Badge>
                </TableCell>
                <TableCell class="text-center">
                  <div class="flex justify-center gap-1">
                    <button
                      @click="handleDelete(brand)"
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
    </Card>

    <div
      v-if="totalPages > 1 && brands.length > 0"
      class="mt-4 flex items-center justify-between"
    >
      <p class="text-sm text-muted-foreground">
        Page {{ currentPage }} of {{ totalPages }} — {{ totalBrands }} total
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
          :disabled="currentPage === totalPages"
          @click="currentPage < totalPages && currentPage++"
        >
          <ChevronRight class="w-4 h-4" />
        </Button>
      </div>
    </div>
    </div>
  </WorkspaceShell>

  <Dialog v-model:open="dialogOpen">
    <DialogTrigger />
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Brand</DialogTitle>
        <DialogDescription>Add a new product brand.</DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div>
          <Label>Name *</Label>
          <Input v-model="newBrandName" placeholder="e.g. Nestlé" />
        </div>
        <div>
          <Label>Code *</Label>
          <Input v-model="newBrandCode" placeholder="e.g. NESTLE" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea v-model="newBrandDescription" placeholder="Optional description" rows="2" />
        </div>
        <div>
          <Label>Website</Label>
          <Input v-model="newBrandWebsite" placeholder="https://example.com" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="resetForm; dialogOpen = false">Cancel</Button>
        <Button @click="handleCreate">Create</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
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
