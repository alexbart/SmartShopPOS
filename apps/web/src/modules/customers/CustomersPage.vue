<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useCustomers, type Customer, type CustomerQuery } from '../composables/useCustomers';
import CustomerTable from './components/CustomerTable.vue';
import CustomerForm from './components/CustomerForm.vue';

const router = useRouter();
const route = useRoute();

const showForm = ref(false);
const editingCustomer = ref<any>(null);
const isLoading = ref(false);

const { listCustomers, createCustomer, updateCustomer } = useCustomers();

const query = ref<CustomerQuery>({
  organizationId: '',
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

const { data: customersData, isLoading: listLoading, refetch } = listCustomers(query);

const customers = computed(() => customersData.value?.items || []);
const total = computed(() => customersData.value?.total || 0);
const page = computed(() => customersData.value?.page || 1);
const limit = computed(() => customersData.value?.limit || 20);
const totalPages = computed(() => Math.ceil((customersData.value?.total || 0) / (customersData.value?.limit || 20)) || 1);

const organizationId = ref('');

// In a real app, this would come from the auth store
function getOrganizationId() {
  // For now, get from localStorage or auth context
  const auth = localStorage.getItem('auth');
  if (auth) {
    try {
      const parsed = JSON.parse(auth);
      return parsed.organizationId || '';
    } catch {}
  }
  return '';
}

async function loadInitialData() {
  const orgId = getOrganizationId();
  if (orgId) {
    organizationId.value = orgId;
    query.value.organizationId = orgId;
  }
}

onMounted(() => {
  loadInitialData();
  // Watch for route changes that might indicate edit mode
  watch(() => route.query.edit, (editId) => {
    if (editId && !showForm.value) {
      openEditForm(String(editId));
    }
  });
});

function openCreateForm() {
  showForm.value = true;
}

function openEditForm(customerId: string) {
  const customer = customers.value.find((c: any) => c.id === customerId);
  if (customer) {
    editingCustomer.value = customer;
    showForm.value = true;
  }
}

function closeForm() {
  showForm.value = false;
  editingCustomer.value = null;
}

async function handleFormSave(payload: any) {
  try {
    if (editingCustomer.value) {
      await updateCustomer.mutateAsync({ id: editingCustomer.value.id, data: payload });
    } else {
      await createCustomer.mutateAsync(payload);
    }
    closeForm();
    await refetch();
  } catch (error) {
    // Error handled by mutation
  }
}

function handleSearch(search: string) {
  query.value = { ...query.value, search: search || undefined, page: 1 };
}

function handleActiveChange(active: boolean | undefined) {
  query.value = { ...query.value, active, page: 1 };
}

function changePage(newPage: number) {
  query.value = { ...query.value, page: newPage };
}

function handleSort(sortBy: string, sortOrder: 'asc' | 'desc') {
  query.value = { ...query.value, sortBy, sortOrder, page: 1 };
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Breadcrumbs -->
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink :href="{ path: '/dashboard' }">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Customers</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Customers</h1>
        <p class="text-muted-foreground mt-1">Manage your customer directory</p>
      </div>
      <Button @click="openCreateForm">
        <Plus class="h-4 w-4 mr-2" />
        New Customer
      </Button>
    </div>

    <!-- Customer Table -->
    <CustomerTable
      :customers="customers"
      :total="total"
      :page="page"
      :limit="limit"
      :loading="listLoading"
      :query="query"
      @update:query="query = $event"
      @view="() => {}"
      @edit="(customer) => openEditForm(customer.id)"
      @delete="(customer) => {}"
    />

    <!-- Create/Edit Form Modal -->
    <CustomerForm
      v-model:open="showForm"
      :customer="editingCustomer"
      @save="handleFormSave"
      @close="() => { showForm.value = false; editingCustomer.value = null; }"
    />
  </div>
</template>