<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { Plus, Trash2, ChevronLeft, ChevronRight, Percent } from '@lucide/vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Tax } from '@/shared/types';
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
const newTaxName = ref('');
const newTaxCode = ref('');
const newTaxRate = ref(0);
const newTaxDescription = ref('');

const { data: taxesResponse, isLoading, isError, refetch } = useQuery({
  queryKey: ['taxes', { search: searchQuery, page: currentPage }],
  queryFn: async () => {
    const params: Record<string, string> = {};
    if (searchQuery.value) params.search = searchQuery.value;
    params.page = String(currentPage.value);
    params.limit = '20';
    const response = await apiClient.get('/taxes', { params });
    return response.data.data;
  },
});

const taxes = computed(() => taxesResponse.value?.items ?? []);
const totalTaxes = computed(() => taxesResponse.value?.total ?? 0);
const totalPages = computed(() => taxesResponse.value?.pages ?? 1);

function handleSearch(query: string) {
  searchQuery.value = query;
  currentPage.value = 1;
}

function handleDelete(tax: Tax) {
  if (confirm(`Delete "${tax.name}"?`)) {
    apiClient.delete(`/taxes/${tax.id}`)
      .then(() => {
        notification.success('Tax deleted', tax.name);
        queryClient.invalidateQueries({ queryKey: ['taxes'] });
      })
      .catch(() => {});
  }
}

async function handleCreate() {
  if (!newTaxName.value || !newTaxCode.value || newTaxRate.value <= 0) {
    notification.error('Please fill in all required fields');
    return;
  }
  try {
    await apiClient.post('/taxes', {
      name: newTaxName.value,
      code: newTaxCode.value,
      rate: Number(newTaxRate.value),
      description: newTaxDescription.value,
      isActive: true,
    });
    notification.success('Tax created', newTaxName.value);
    dialogOpen.value = false;
    queryClient.invalidateQueries({ queryKey: ['taxes'] });
    resetForm();
  } catch (e) {
    notification.error('Failed to create tax');
  }
}

function resetForm() {
  newTaxName.value = '';
  newTaxCode.value = '';
  newTaxRate.value = 0;
  newTaxDescription.value = '';
}
</script>

<template>
  <WorkspaceShell
    workspace-icon="Percent"
    workspace-title="Taxes"
    workspace-description="Manage tax rates"
    :action-button="{
      label: 'New Tax',
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
            placeholder="Search taxes..."
            @search="handleSearch"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-0">
          <div v-if="isError" class="p-6">
            <ErrorState title="Failed to load taxes" retryable @retry="refetch" />
          </div>

          <div v-else-if="isLoading" class="p-4">
            <LoadingSkeleton :rows="5" />
          </div>

          <div v-else-if="!taxes.length" class="p-6">
            <EmptyState
              icon="Percent"
              title="No taxes found"
              description="No taxes match your search. Create a new tax rate to get started."
            >
              <Button @click="dialogOpen = true">
                <Plus class="w-4 h-4 mr-2" />
                New Tax
              </Button>
            </EmptyState>
          </div>

          <div v-else class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead class="text-right">Rate</TableHead>
                  <TableHead class="text-center">Status</TableHead>
                  <TableHead class="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="tax in taxes" :key="tax.id">
                  <TableCell>
                    <span class="font-medium">{{ tax.name }}</span>
                  </TableCell>
                  <TableCell>
                    <span class="font-mono text-sm">{{ tax.code }}</span>
                  </TableCell>
                  <TableCell class="text-right">
                    <span class="text-sm font-medium">{{ tax.rate }}%</span>
                  </TableCell>
                  <TableCell class="text-center">
                    <Badge :variant="tax.isActive ? 'default' : 'secondary'">
                      {{ tax.isActive ? 'Active' : 'Inactive' }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-center">
                    <div class="flex justify-center gap-1">
                      <button
                        @click="handleDelete(tax)"
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
          v-if="totalPages > 1 && taxes.length > 0"
          class="p-4 border-t flex items-center justify-between"
        >
          <p class="text-sm text-muted-foreground">
            Page {{ currentPage }} of {{ totalPages }} — {{ totalTaxes }} total
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
      </Card>
    </div>
  </WorkspaceShell>

  <Dialog v-model:open="dialogOpen">
    <DialogTrigger />
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Tax</DialogTitle>
        <DialogDescription>Add a new tax rate.</DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div>
          <Label>Name *</Label>
          <Input v-model="newTaxName" placeholder="e.g. VAT" />
        </div>
        <div>
          <Label>Code *</Label>
          <Input v-model="newTaxCode" placeholder="e.g. VAT16" />
        </div>
        <div>
          <Label>Rate (%)</Label>
          <div class="relative">
            <Percent class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              v-model.number="newTaxRate"
              type="number"
              step="0.01"
              min="0"
              placeholder="16.00"
              class="pl-10"
            />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea v-model="newTaxDescription" placeholder="Optional description" rows="2" />
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
