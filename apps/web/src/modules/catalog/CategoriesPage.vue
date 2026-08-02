<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { Plus, Trash2, ChevronLeft, ChevronRight } from '@lucide/vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import type { Category } from '@/shared/types';
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
const newCategoryName = ref('');
const newCategoryCode = ref('');
const newCategoryColor = ref('#3b82f6');
const newCategoryDescription = ref('');

const { data: categoriesResponse, isLoading, isError, refetch } = useQuery({
  queryKey: ['categories', { search: searchQuery, page: currentPage }],
  queryFn: async () => {
    const params: Record<string, string> = {};
    if (searchQuery.value) params.search = searchQuery.value;
    params.page = String(currentPage.value);
    params.limit = '20';
    const response = await apiClient.get('/categories', { params });
    return response.data.data;
  },
});

const categories = computed(() => categoriesResponse.value?.items ?? []);
const totalCategories = computed(() => categoriesResponse.value?.total ?? 0);
const totalPages = computed(() => categoriesResponse.value?.pages ?? 1);

function handleSearch(query: string) {
  searchQuery.value = query;
  currentPage.value = 1;
}

function handleDelete(category: Category) {
  if (confirm(`Delete "${category.name}"?`)) {
    apiClient.delete(`/categories/${category.id}`)
      .then(() => {
        notification.success('Category deleted', category.name);
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      })
      .catch(() => {});
  }
}

async function handleCreate() {
  if (!newCategoryName.value || !newCategoryCode.value) {
    notification.error('Please fill in required fields');
    return;
  }
  try {
    await apiClient.post('/categories', {
      name: newCategoryName.value,
      code: newCategoryCode.value,
      color: newCategoryColor.value,
      description: newCategoryDescription.value,
      isActive: true,
    });
    notification.success('Category created', newCategoryName.value);
    dialogOpen.value = false;
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    resetForm();
  } catch (e) {
    notification.error('Failed to create category');
  }
}

function resetForm() {
  newCategoryName.value = '';
  newCategoryCode.value = '';
  newCategoryDescription.value = '';
  newCategoryColor.value = '#3b82f6';
}
</script>

<template>
  <WorkspaceShell
    workspace-icon="Tag"
    workspace-title="Categories"
    workspace-description="Organize your products by category"
    :action-button="{
      label: 'New Category',
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
            placeholder="Search categories..."
            @search="handleSearch"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-0">
          <div v-if="isError" class="p-6">
            <ErrorState title="Failed to load categories" retryable @retry="refetch" />
          </div>

          <div v-else-if="isLoading" class="p-4">
            <LoadingSkeleton :rows="5" />
          </div>

          <div v-else-if="!categories.length" class="p-6">
            <EmptyState
              icon="Tag"
              title="No categories found"
              description="No categories match your search. Try adjusting filters or create a new category."
            >
              <Button @click="dialogOpen = true">
                <Plus class="w-4 h-4 mr-2" />
                New Category
              </Button>
            </EmptyState>
          </div>

          <div v-else class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead class="text-center">Color</TableHead>
                  <TableHead class="text-center">Status</TableHead>
                  <TableHead class="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="category in categories" :key="category.id">
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <div
                        class="w-3 h-3 rounded-full"
                        :style="{ backgroundColor: category.color }"
                      />
                      <span class="font-medium">{{ category.name }}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span class="font-mono text-sm">{{ category.code }}</span>
                  </TableCell>
                  <TableCell class="text-center">
                    <Badge :style="{ backgroundColor: category.color + '20', color: category.color }">
                      {{ category.color }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-center">
                    <Badge :variant="category.isActive ? 'default' : 'secondary'">
                      {{ category.isActive ? 'Active' : 'Inactive' }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-center">
                    <div class="flex justify-center gap-1">
                      <button
                        @click="handleDelete(category)"
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
          v-if="totalPages > 1 && categories.length > 0"
          class="p-4 border-t flex items-center justify-between"
        >
          <p class="text-sm text-muted-foreground">
            Page {{ currentPage }} of {{ totalPages }} — {{ totalCategories }} total
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
        <DialogTitle>Create Category</DialogTitle>
        <DialogDescription>
          Add a new product category.
        </DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4">
        <div>
          <Label>Name *</Label>
          <Input v-model="newCategoryName" placeholder="e.g. Dairy" />
        </div>
        <div>
          <Label>Code *</Label>
          <Input v-model="newCategoryCode" placeholder="e.g. DAIRY" />
        </div>
        <div>
          <Label>Color</Label>
          <div class="flex items-center gap-2">
            <Input type="color" v-model="newCategoryColor" class="w-10 h-8 p-0" />
            <span class="text-xs text-muted-foreground">{{ newCategoryColor }}</span>
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea v-model="newCategoryDescription" placeholder="Optional description" rows="2" />
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
