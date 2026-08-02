<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useShiftStore } from '@/modules/shift/stores/shiftStore';
import { useGreeting } from '@/modules/shift/composables/useGreeting';
import { notification } from '@/stores/notification';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check } from '@lucide/vue';

const router = useRouter();
const auth = useAuthStore();
const shiftStore = useShiftStore();
const { greeting } = useGreeting();

const step = ref<'welcome' | 'drawer' | 'ready'>('welcome');
const openingFloat = ref(5000);
const notes = ref('');
const isSaving = ref(false);

const displayName = computed(() => {
  return auth.user ? `${auth.user.firstName} ${auth.user.lastName}` : 'Alex';
});

const branchName = computed(() => {
  return auth.branch?.name || 'Nairobi CBD';
});

const drawerStatusText = computed(() => {
  if (shiftStore.drawerStatus === 'open') return { label: 'Open', color: 'text-green-600' };
  if (shiftStore.drawerStatus === 'closed') return { label: 'Closed', color: 'text-red-600' };
  return { label: 'Checking...', color: 'text-muted-foreground' };
});

async function handleStartShift() {
  step.value = 'drawer';
}

async function handleOpenDrawer() {
  if (!openingFloat.value || openingFloat.value <= 0) {
    notification.error('Invalid amount', 'Please enter a valid opening float amount');
    return;
  }

  isSaving.value = true;
  try {
    await shiftStore.openDrawer(openingFloat.value, notes.value);
    notification.success('✓ Drawer Opened', `Opening float: KES ${openingFloat.value.toLocaleString()}`);
    step.value = 'ready';
  } catch {
  } finally {
    isSaving.value = false;
  }
}

async function handleGoToPos() {
  await router.push('/pos');
}

onMounted(() => {
  if (shiftStore.isShiftOpen) {
    step.value = 'ready';
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/30 p-4">
    <Card class="w-full max-w-md shadow-lg">
      <CardContent class="pt-6">
        <!-- STEP 1: Welcome -->
        <div v-if="step === 'welcome'" class="text-center space-y-6">
          <div class="space-y-2">
            <h1 class="text-2xl font-bold">
              {{ greeting.text }}, {{ displayName.split(' ')[0] }} 👋
            </h1>
            <p class="text-sm text-muted-foreground">Let's get you set up for today.</p>
          </div>

          <div class="space-y-3 text-left">
            <div class="flex justify-between py-2 border-b">
              <span class="text-muted-foreground">Branch</span>
              <span class="font-medium">{{ branchName }}</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span class="text-muted-foreground">Cash Drawer</span>
              <span :class="drawerStatusText.color" class="font-medium">{{ drawerStatusText.label }}</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span class="text-muted-foreground">Today's Shift</span>
              <span class="font-medium">Not Started</span>
            </div>
          </div>

          <Button
            class="w-full touch-target h-12 text-base"
            :disabled="isSaving || shiftStore.drawerStatus === 'loading'"
            @click="handleStartShift"
          >
            Start Shift
          </Button>
        </div>

        <!-- STEP 2: Open Drawer -->
        <div v-else-if="step === 'drawer'" class="space-y-5">
          <div class="text-center mb-4">
            <h2 class="text-xl font-bold">Open Cash Drawer</h2>
            <p class="text-sm text-muted-foreground mt-1">Enter the opening float amount.</p>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">Opening Float</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">KES</span>
                <Input
                  v-model.number="openingFloat"
                  type="number"
                  placeholder="5000"
                  class="pl-12 h-12 text-lg"
                  :min="1"
                  step="100"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Notes</label>
              <Textarea
                v-model="notes"
                placeholder="Optional notes for this shift"
                class="resize-none"
                rows="3"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Button
              class="w-full touch-target h-12"
              :loading="isSaving"
              @click="handleOpenDrawer"
            >
              Open Drawer
            </Button>
            <Button
              variant="ghost"
              class="w-full touch-target h-12"
              @click="step = 'welcome'"
            >
              Back
            </Button>
          </div>
        </div>

        <!-- STEP 3: Ready -->
        <div v-else-if="step === 'ready'" class="text-center space-y-6">
          <div class="flex justify-center">
            <div class="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <Check class="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div class="space-y-2">
            <h2 class="text-xl font-bold">Ready for Business</h2>
            <p class="text-sm text-muted-foreground">Your shift is open and ready.</p>
          </div>

          <div class="space-y-2 text-left text-sm">
            <div class="flex justify-between py-1">
              <span class="text-muted-foreground">Drawer</span>
              <span class="font-medium text-green-600">Open</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-muted-foreground">Branch</span>
              <span class="font-medium">{{ branchName }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-muted-foreground">Cashier</span>
              <span class="font-medium">{{ displayName }}</span>
            </div>
          </div>

          <div class="pt-2">
            <Button
              class="w-full touch-target h-12 text-lg"
              @click="handleGoToPos"
            >
              Go To POS
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
