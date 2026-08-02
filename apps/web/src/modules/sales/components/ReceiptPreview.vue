<script setup lang="ts">
import type { ReceiptData } from '@/modules/sales/composables/types';
import { Printer, Mail, Send } from '@lucide/vue';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const props = defineProps<{
  receipt: ReceiptData;
}>();

const emit = defineEmits<{
  (e: 'print'): void;
  (e: 'email'): void;
  (e: 'sms'): void;
}>();
</script>

<template>
  <Card class="bg-white dark:bg-popover">
    <CardContent class="pt-6">
      <div class="text-center mb-4">
        <h2 class="text-xl font-bold">SmartShop POS</h2>
        <p class="text-xs text-muted-foreground">
          Receipt #{{ receipt.number }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ new Date(receipt.timestamp).toLocaleString() }}
        </p>
      </div>

      <div
        v-if="receipt.customerName"
        class="mb-3 text-sm"
      >
        <p class="font-medium">Customer:</p>
        <p>{{ receipt.customerName }}</p>
      </div>

      <div class="space-y-2 text-sm">
        <div
          v-for="(item, i) in receipt.items"
          :key="i"
          class="flex justify-between"
        >
          <span>{{ item.name }} x{{ item.quantity }}</span>
          <span>KES {{ item.total.toLocaleString() }}</span>
        </div>
      </div>

      <Separator class="my-3" />

      <div class="space-y-1 text-sm">
        <div class="flex justify-between">
          <span class="text-muted-foreground">Subtotal</span>
          <span>KES {{ receipt.subtotal.toLocaleString() }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">Tax</span>
          <span>KES {{ receipt.tax.toLocaleString() }}</span>
        </div>
        <div
          v-if="receipt.discount > 0"
          class="flex justify-between text-green-600"
        >
          <span>Discount</span>
          <span>-KES {{ receipt.discount.toLocaleString() }}</span>
        </div>
        <div class="flex justify-between font-bold text-lg border-t pt-2">
          <span>TOTAL</span>
          <span>KES {{ receipt.total.toLocaleString() }}</span>
        </div>
      </div>

      <div class="mt-4 text-center">
        <p class="text-xs text-muted-foreground">
          Payment: {{ receipt.paymentMethod }}
        </p>
        <p class="text-xs text-muted-foreground mt-1">
          Cashier: {{ receipt.cashier }}
        </p>
        <p class="text-xs text-muted-foreground mt-2">
          Thank you for your purchase!
        </p>
      </div>
    </CardContent>

    <CardFooter class="flex justify-center gap-2 border-t">
        <Button size="sm" @click="$emit('print')" class="touch-target">
        <Printer class="w-4 h-4 mr-1" />
        Print
      </Button>
      <Button
        variant="outline"
        size="sm"
        @click="$emit('email')"
        class="touch-target"
      >
        <Mail class="w-4 h-4 mr-1" />
        Email
      </Button>
      <Button
        variant="outline"
        size="sm"
        @click="$emit('sms')"
        class="touch-target"
      >
        <Send class="w-4 h-4 mr-1" />
        SMS
      </Button>
    </CardFooter>
  </Card>
</template>
