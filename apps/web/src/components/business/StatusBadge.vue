<script setup lang="ts">
defineProps<{
  status: string;
  size?: 'sm' | 'md';
}>();
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      {
        'status-badge-draft': status === 'DRAFT',
        'status-badge-pending': status === 'PENDING' || status === 'PENDING_APPROVAL',
        'status-badge-submitted': status === 'SUBMITTED',
        'status-badge-approved': status === 'APPROVED',
        'status-badge-received': status === 'RECEIVED' || status === 'PARTIALLY_RECEIVED',
        'status-badge-rejected': status === 'REJECTED' || status === 'CANCELLED' || status === 'VOIDED',
        'status-badge-pending': status === 'PENDING_PAYMENT',
        'bg-gray-100 text-gray-800': ![
          'DRAFT', 'PENDING', 'PENDING_APPROVAL', 'SUBMITTED', 'APPROVED',
          'RECEIVED', 'PARTIALLY_RECEIVED', 'REJECTED', 'CANCELLED', 'VOIDED', 'PENDING_PAYMENT',
        ].includes(status),
      },
    ]"
  >
    {{ status }}
  </span>
</template>
