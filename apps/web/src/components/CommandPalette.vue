<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  BarChart3,
  Users,
  CreditCard,
  Settings,
  Search,
  Plus,
  Warehouse,
} from '@lucide/vue';

interface Command {
  id: string;
  label: string;
  icon: any;
  shortcut?: string;
  action: () => void;
  category: string;
}

const router = useRouter();
const isOpen = ref(false);
const searchQuery = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

const commands = computed<Command[]>(() => [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    category: 'Navigation',
    action: () => { router.push('/'); close(); },
  },
  {
    id: 'products',
    label: 'Products',
    icon: Package,
    category: 'Navigation',
    action: () => { router.push('/products'); close(); },
  },
  {
    id: 'pos',
    label: 'New Sale',
    icon: ShoppingCart,
    shortcut: 'F2',
    category: 'Actions',
    action: () => { router.push('/pos'); close(); },
  },
  {
    id: 'purchase-orders',
    label: 'Purchase Orders',
    icon: Receipt,
    category: 'Navigation',
    action: () => { router.push('/purchase-orders'); close(); },
  },
  {
    id: 'new-po',
    label: 'New Purchase Order',
    icon: Plus,
    shortcut: 'Ctrl+N',
    category: 'Actions',
    action: () => { router.push('/purchase-orders/create'); close(); },
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Warehouse,
    category: 'Navigation',
    action: () => { router.push('/inventory'); close(); },
  },
  {
    id: 'cash-drawer',
    label: 'Cash Drawer',
    icon: CreditCard,
    category: 'Navigation',
    action: () => { router.push('/cash-drawer'); close(); },
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    category: 'Navigation',
    action: () => { router.push('/customers'); close(); },
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    category: 'Navigation',
    action: () => { router.push('/reports/sales'); close(); },
  },
  {
    id: 'theme',
    label: 'Theme Settings',
    icon: Settings,
    category: 'Settings',
    action: () => { router.push('/theme-settings'); close(); },
  },
]);

const filteredCommands = computed(() => {
  if (!searchQuery.value) return commands.value;
  const query = searchQuery.value.toLowerCase();
  return commands.value.filter(
    (c) =>
      c.label.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query) ||
      c.shortcut?.toLowerCase().includes(query)
  );
});

const groupedCommands = computed(() => {
  const groups: Record<string, Command[]> = {};
  for (const cmd of filteredCommands.value) {
    if (!groups[cmd.category]) groups[cmd.category] = [];
    groups[cmd.category].push(cmd);
  }
  return groups;
});

function close() {
  isOpen.value = false;
  searchQuery.value = '';
}

function toggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    setTimeout(() => inputRef.value?.focus(), 100);
  }
}

function onKeyDown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    e.stopPropagation();
    toggle();
    return;
  }
  if (e.key === 'Escape') {
    close();
  }
}

function executeCommand(cmd: Command) {
  cmd.action();
  searchQuery.value = '';
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] backdrop-blur-sm"
        @click.self="close"
      >
        <Transition name="scale">
          <div
            class="bg-popover border border-border rounded-lg shadow-xl w-full max-w-md mx-4"
            @click.stop
          >
            <div class="relative p-3 border-b">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref="inputRef"
                v-model="searchQuery"
                type="text"
                placeholder="Type a command or search..."
                class="w-full pl-10 pr-3 py-2 text-sm bg-transparent focus:outline-none"
                autocomplete="off"
              />
              <kbd
                v-if="!searchQuery"
                class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-muted-foreground bg-muted rounded"
              >
                Cmd+K
              </kbd>
            </div>

            <div class="max-h-80 overflow-y-auto py-2">
              <div
                v-for="(group, groupName) in groupedCommands"
                :key="groupName"
              >
                <p class="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {{ groupName }}
                </p>
                <button
                  v-for="cmd in group"
                  :key="cmd.id"
                  @click="executeCommand(cmd)"
                  class="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-muted transition-colors touch-target"
                >
                  <component :is="cmd.icon" class="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span class="flex-1">{{ cmd.label }}</span>
                  <kbd
                    v-if="cmd.shortcut"
                    class="text-xs text-muted-foreground bg-muted px-1.5 py-0.25 rounded"
                  >
                    {{ cmd.shortcut }}
                  </kbd>
                </button>
              </div>
            </div>

            <div class="border-t p-2 text-xs text-muted-foreground">
              <div class="flex items-center justify-center gap-2 py-1">
                <kbd class="px-1.5 py-0.25 bg-muted rounded">Ctrl</kbd>
                <span>+</span>
                <kbd class="px-1.5 py-0.25 bg-muted rounded">K</kbd>
                <span>to search commands</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.scale-enter-active { transition: transform 0.15s ease, opacity 0.15s ease; }
.scale-enter-from { transform: scale(0.95); opacity: 0; }
.scale-leave-to { transform: scale(0.95); opacity: 0; }
</style>
