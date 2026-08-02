<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { Plus, Trash2, ChevronLeft, ChevronRight } from '@lucide/vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Unit } from '@/shared/types';
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

const queryClient = useQueryClient();

const searchQuery = ref('');
const currentPage = ref(1);
const dialogOpen = ref(false);
const newUnitName = ref('');
const newUnitCode = ref('');
const newUnitAbbreviation = ref('');

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
  if (!newUnitName.value || !newUnitCode.value) {
    notification.error('Please fill in required fields');
    return;
  }
  try {
    await apiClient.post('/units', {
      name: newUnitName.value,
      code: newUnitCode.value,
      abbreviation: newUnitAbbreviation.value,
      isActive: true,
    });
    notification.success('Unit created', newUnitName.value);
    dialogOpen.value = false;
    queryClient.invalidateQueries({ queryKey: ['units'] });
    resetForm();
  } catch (e) {
    notification.error('Failed to create unit');
  }
}

function resetForm() {
  newUnitName.value = '';
  newUnitCode.value = '';
  newUnitAbbreviation.value = '';
}
</script>

<template>
  <WorkspaceShell
    workspace-icon="Box"
    workspace-title="Units"
    workspace-description="Manage measurement units"
    :action-button="{
      label: 'New Unit',
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
            placeholder="Search units..."
            @search="handleSearch"
          />
        </CardContent>
      </Card>

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
        <DialogTitle>Create Unit</DialogTitle>
        <DialogDescription>Add a new measurement unit.</DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div>
          <Label>Name *</Label>
          <Input v-model="newUnitName" placeholder="e.g. Kilogram" />
        </div>
        <div>
          <Label>Code *</Label>
          <Input v-model="newUnitCode" placeholder="e.g. KG" />
        </div>
        <div>
          <Label>Abbreviation</Label>
          <Input v-model="newUnitAbbreviation" placeholder="e.g. kg" />
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
