<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Edit, Phone, Mail, MapPin, CreditCard, Star, Trash2, Loader2 } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';
import { useCustomers } from '../composables/useCustomers';

const route = useRoute();
const router = useRouter();
const { getCustomer, deleteCustomer } = useCustomers();

const customerId = route.params.id as string;
const customer = ref<Customer | null>(null);
const isLoading = ref(true);
const isDeleting = ref(false);
const salesHistory = ref<any[]>([]);
const isLoadingSales = ref(false);

interface Customer {
  id: string;
  code: string;
  name: string;
  phone?: string;
  email?: string;
  taxPin?: string;
  address?: string;
  loyaltyPoints: number;
  creditLimit?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatMoneyKE(value: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
  }).format(value);
}

async function loadCustomer() {
  isLoading.value = true;
  try {
    const { data } = await getCustomer(customerId);
    if (data.value) {
      customer.value = data.value;
    } else {
      notification.error('Not found', 'Customer not found');
      router.push('/customers');
    }
  } catch (error) {
    notification.error('Error', 'Failed to load customer');
    router.push('/customers');
  } finally {
    isLoading.value = false;
  }
}

async function loadSalesHistory() {
  isLoadingSales.value = true;
  try {
    const response = await apiClient.get(`/sales?customerId=${customerId}&page=1&limit=20`);
    salesHistory.value = (response.data as any).data?.items || [];
  } catch (error) {
    console.error('Failed to load sales history:', error);
  } finally {
    isLoadingSales.value = false;
  }
}

async function handleDelete() {
  if (!confirm('Are you sure you want to deactivate this customer? This action cannot be undone.')) return;
  
  isDeleting.value = true;
  try {
    await deleteCustomer.mutateAsync(customerId);
    notification.success('Customer deactivated');
    router.push('/customers');
  } catch (error) {
    notification.error('Failed to deactivate customer');
  } finally {
    isDeleting.value = false;
}
  }

  onMounted(() => {
  loadCustomer();
  loadSalesHistory();
});

watch(() => route.params.id, (newId) => {
  if (newId && newId !== customerId) {
    // Need to update the customerId reactive value
    (customerId as any) = newId;
    loadCustomer();
    loadSalesHistory();
  }
});
</script>

<template>
  <div v-if="isLoading" class="p-6 flex items-center justify-center h-64">
    <Loader2 class="h-8 w-8 animate-spin text-primary" />
  </div>

  <div v-else-if="customer" class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold">{{ customer.name }}</h1>
          <Badge :variant="customer.isActive ? 'default' : 'secondary'">
            {{ customer.isActive ? 'Active' : 'Inactive' }}
          </Badge>
        </div>
        <p class="text-muted-foreground mt-1">Code: {{ customer.code }} · Member since {{ formatDate(customer.createdAt) }}</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="$router.push({ path: '/customers', query: { edit: customer.id } })">
          <Edit class="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button variant="destructive" @click="handleDelete" :disabled="isDeleting">
          <Trash2 class="h-4 w-4 mr-2" />
          {{ isDeleting ? 'Deactivating...' : 'Deactivate' }}
        </Button>
      </div>

    <!-- Info Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Phone</CardTitle>
        </CardHeader>
        <CardContent>
          <p v-if="customer.phone" class="text-lg font-medium flex items-center gap-2">
            <Phone class="h-5 w-5 text-muted-foreground" />
            {{ customer.phone }}
          </p>
          <p v-else class="text-muted-foreground">No phone number</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Email</CardTitle>
        </CardHeader>
        <CardContent>
          <p v-if="customer.email" class="text-lg font-medium flex items-center gap-2">
            <Mail class="h-5 w-5 text-muted-foreground" />
            {{ customer.email }}
          </p>
          <p v-else class="text-muted-foreground">No email</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Loyalty Points</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold flex items-center gap-2">
            <Star class="h-6 w-6 text-amber-500" />
            {{ customer.loyaltyPoints.toLocaleString() }}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">Credit Limit</CardTitle>
        </CardHeader>
        <CardContent>
          <p v-if="customer.creditLimit" class="text-2xl font-bold flex items-center gap-2">
            <CreditCard class="h-6 w-6 text-muted-foreground" />
            {{ formatMoneyKE(customer.creditLimit) }}
          </p>
          <p v-else class="text-muted-foreground">No credit limit set</p>
        </CardContent>
      </Card>
    </div>

    <!-- Address & Tax PIN -->
    <Card class="col-span-full" v-if="customer.address || customer.taxPin">
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-if="customer.address" class="space-y-1">
          <Label class="text-sm font-medium text-muted-foreground">Address</Label>
          <p class="flex items-center gap-2">
            <MapPin class="h-4 w-4 text-muted-foreground" />
            {{ customer.address }}
          </p>
        </div>
        <div v-if="customer.taxPin" class="space-y-1">
          <Label class="text-sm font-medium text-muted-foreground">Tax PIN (KRA)</Label>
          <p>{{ customer.taxPin }}</p>
        </div>
      </CardContent>
    </Card>

    <!-- Tabs for Sales History -->
    <Tabs defaultValue="sales" class="w-full">
      <TabsList>
        <TabsTrigger value="sales">Sales History ({{ salesHistory.length }})</TabsTrigger>
      </TabsList>

      <TabsContent value="sales" class="pt-4">
        <Card>
          <CardContent class="p-0">
            <div v-if="isLoadingSales" class="p-8 text-center">
              <Loader2 class="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>

            <div v-else-if="salesHistory.length === 0" class="p-8 text-center text-muted-foreground">
              No sales history for this customer.
            </div>

            <Table v-else>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead class="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="sale in salesHistory" :key="sale.id" class="hover:bg-accent/50">
                  <TableCell class="font-medium">{{ sale.number }}</TableCell>
                  <TableCell>{{ formatDate(sale.createdAt) }}</TableCell>
                  <TableCell class="text-right font-medium">{{ formatMoneyKE(sale.total) }}</TableCell>
                  <TableCell>
                    <Badge :variant="sale.paymentMethod === 'MPESA' ? 'default' : sale.paymentMethod === 'CASH' ? 'secondary' : 'outline'">
                      {{ sale.paymentMethod }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge :variant="sale.status === 'COMPLETED' ? 'default' : sale.status === 'VOIDED' ? 'destructive' : 'secondary'">
                      {{ sale.status }}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Card>
    </Tabs>
  </div>
</template>