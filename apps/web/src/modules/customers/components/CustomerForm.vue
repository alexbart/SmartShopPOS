<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { Loader2, X, AlertCircle } from '@lucide/vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

const customerSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Name is required').max(255),
    code: z.string().min(1, 'Code is required').max(50).regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase letters, numbers, underscores, or hyphens'),
    phone: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone format').optional().or(z.literal('')),
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    taxPin: z.string().max(50).optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    loyaltyPoints: z.coerce.number().min(0).default(0),
    creditLimit: z.coerce.number().min(0).optional(),
    isActive: z.boolean().default(true),
  }),
);

interface CustomerData {
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
}

interface Props {
  open: boolean;
  customer?: CustomerData | null;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  customer: null,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', payload: CustomerData): void;
}>();

const isEditing = ref(false);
const isSubmitting = ref(false);
const submitError = ref<string | null>(null);

const form = useForm({
  validationSchema: customerSchema,
  initialValues: {
    name: '',
    code: '',
    phone: '',
    email: '',
    taxPin: '',
    address: '',
    loyaltyPoints: 0,
    creditLimit: 0,
    isActive: true,
  },
});

const title = computed(() => (isEditing.value ? 'Edit Customer' : 'New Customer'));
const submitLabel = computed(() => (isEditing.value ? 'Update Customer' : 'Create Customer'));

// Local refs for template bindings - synced with form
const name = ref('');
const code = ref('');
const phone = ref('');
const email = ref('');
const taxPin = ref('');
const address = ref('');
const loyaltyPoints = ref(0);
const creditLimit = ref(0);
const isActive = ref(true);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      submitError.value = null;
      const customer = props.customer;
      if (customer) {
        isEditing.value = true;
        nextTick(() => {
          form.setValues({
            name: customer.name,
            code: customer.code,
            phone: customer.phone || '',
            email: customer.email || '',
            taxPin: customer.taxPin || '',
            address: customer.address || '',
            loyaltyPoints: customer.loyaltyPoints || 0,
            creditLimit: customer.creditLimit || 0,
            isActive: customer.isActive,
          });
        });
      } else {
        isEditing.value = false;
        form.resetForm();
      }
    } else {
      form.resetForm();
    }
  },
  { immediate: true },
);

// Sync local refs with form values
watch(form.values, (vals) => {
  name.value = vals.name || '';
  code.value = vals.code || '';
  phone.value = vals.phone || '';
  email.value = vals.email || '';
  taxPin.value = vals.taxPin || '';
  address.value = vals.address || '';
  loyaltyPoints.value = vals.loyaltyPoints || 0;
  creditLimit.value = vals.creditLimit || 0;
  isActive.value = vals.isActive ?? true;
}, { immediate: true, deep: true });

async function handleSubmit() {
  submitError.value = null;
  isSubmitting.value = true;

  try {
    const { valid } = await form.validate();
    if (!valid) return;

    await form.handleSubmit((values) => {
      const payload = {
        id: props.customer?.id || '',
        name: values.name,
        code: (values.code || '').toUpperCase(),
        phone: values.phone || undefined,
        email: values.email || undefined,
        taxPin: values.taxPin || undefined,
        address: values.address || undefined,
        loyaltyPoints: values.loyaltyPoints || 0,
        creditLimit: values.creditLimit > 0 ? values.creditLimit : undefined,
        isActive: values.isActive,
      };
      emit('save', payload);
    })();

  } catch (error) {
    submitError.value = 'Failed to save customer. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  form.resetForm();
  submitError.value = null;
  emit('close');
}
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click="handleClose" @keydown.esc="handleClose">
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" @click.stop>
        <Card class="border-none shadow-none">
          <CardHeader class="pb-4">
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="text-lg">{{ title }}</CardTitle>
                <CardDescription class="text-sm">
                  {{ isEditing ? 'Update customer information' : 'Add a new customer to the directory' }}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" class="text-gray-500 hover:text-gray-900" @click="handleClose">
                <X class="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <form @submit.prevent="handleSubmit">
            <CardContent class="space-y-4 pb-6">
              <div v-if="submitError" class="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                <AlertCircle class="h-4 w-4 flex-shrink-0" />
                {{ submitError }}
              </div>

              <!-- Name & Code -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <Label for="name">Name <span class="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    v-model="name"
                    @input="form.setFieldValue('name', $event.target.value)"
                    placeholder="Customer name"
                    :class="{ 'border-red-500': form.errors.name }"
                  />
                  <p v-if="form.errors.name" class="text-sm text-destructive">{{ form.errors.name }}</p>
                </div>

                <div class="space-y-1.5">
                  <Label for="code">Code <span class="text-destructive">*</span></Label>
                  <Input
                    id="code"
                    v-model="code"
                    @input="form.setFieldValue('code', $event.target.value.toUpperCase())"
                    placeholder="CUST001"
                    :class="{ 'border-red-500': form.errors.code }"
                  />
                  <p v-if="form.errors.code" class="text-sm text-destructive">{{ form.errors.code }}</p>
                  <p class="text-xs text-muted-foreground">Uppercase, numbers, underscores, hyphens only</p>
                </div>
              </div>

              <!-- Phone & Email -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <Label for="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    v-model="phone"
                    @input="form.setFieldValue('phone', $event.target.value)"
                    placeholder="+254 7XX XXX XXX"
                    :class="{ 'border-red-500': form.errors.phone }"
                  />
                  <p v-if="form.errors.phone" class="text-sm text-destructive">{{ form.errors.phone }}</p>
                </div>

                <div class="space-y-1.5">
                  <Label for="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    v-model="email"
                    @input="form.setFieldValue('email', $event.target.value)"
                    placeholder="customer@example.com"
                    :class="{ 'border-red-500': form.errors.email }"
                  />
                  <p v-if="form.errors.email" class="text-sm text-destructive">{{ form.errors.email }}</p>
                </div>
              </div>

              <!-- Tax PIN & Credit Limit -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <Label for="taxPin">Tax PIN (KRA)</Label>
                  <Input
                    id="taxPin"
                    v-model="taxPin"
                    @input="form.setFieldValue('taxPin', $event.target.value)"
                    placeholder="A001234567X"
                    :class="{ 'border-red-500': form.errors.taxPin }"
                  />
                  <p v-if="form.errors.taxPin" class="text-sm text-destructive">{{ form.errors.taxPin }}</p>
                </div>

                <div class="space-y-1.5">
                  <Label for="creditLimit">Credit Limit (KES)</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    v-model.number="creditLimit"
                    @input="form.setFieldValue('creditLimit', $event.target.valueAsNumber)"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    :class="{ 'border-red-500': form.errors.creditLimit }"
                  />
                  <p v-if="form.errors.creditLimit" class="text-sm text-destructive">{{ form.errors.creditLimit }}</p>
                </div>
              </div>

              <!-- Address -->
              <div class="space-y-1.5">
                <Label for="address">Address</Label>
                <Textarea
                  id="address"
                  v-model="address"
                  @input="form.setFieldValue('address', $event.target.value)"
                  placeholder="Physical address"
                  rows="3"
                  :class="{ 'border-red-500': form.errors.address }"
                />
                <p v-if="form.errors.address" class="text-sm text-destructive">{{ form.errors.address }}</p>
              </div>

              <!-- Loyalty Points (read-only for existing customers) -->
              <div v-if="!isEditing" class="space-y-1.5">
                <Label for="loyaltyPoints">Initial Loyalty Points</Label>
                <Input
                  id="loyaltyPoints"
                  type="number"
                  v-model.number="loyaltyPoints"
                  @input="form.setFieldValue('loyaltyPoints', $event.target.valueAsNumber)"
                  min="0"
                  step="1"
                  :class="{ 'border-red-500': form.errors.loyaltyPoints }"
                />
                <p v-if="form.errors.loyaltyPoints" class="text-sm text-destructive">{{ form.errors.loyaltyPoints }}</p>
              </div>

              <Separator class="my-4" />

              <!-- Active Status -->
              <div class="flex items-center justify-between">
                <div>
                  <Label class="font-medium">Active Status</Label>
                  <p class="text-sm text-muted-foreground">Inactive customers are hidden from searches and cannot be selected at checkout</p>
                </div>
                <Switch v-model="isActive" @update:modelValue="form.setFieldValue('isActive', $event)" />
              </div>

              <!-- Actions -->
              <div class="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" @click="handleClose" :disabled="isSubmitting">
                  Cancel
                </Button>
                <Button type="submit" :disabled="isSubmitting">
                  <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
                  {{ isSubmitting ? 'Saving...' : submitLabel }}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>