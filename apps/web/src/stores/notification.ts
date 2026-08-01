import { ref, type Ref } from 'vue';
import type { ToastOptions } from '@/components/Toast.vue';

let nextId = 0;

class NotificationService {
  private toasts: Ref<ToastOptions[]> = ref([]);
  private listeners: ((toasts: ToastOptions[]) => void)[] = [];

  get toasts() {
    return this.toasts.value;
  }

  private notify(toast: Omit<ToastOptions, 'id'>) {
    const id = `toast-${nextId++}`;
    const duration = toast.duration ?? 4000;
    const item: ToastOptions = { ...toast, id };
    this.toasts.value.push(item);

    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: string) {
    this.toasts.value = this.toasts.value.filter((t) => t.id !== id);
  }

  success(title: string, message?: string) {
    this.notify({ type: 'success', title, message });
  }

  error(title: string | Error | { message?: string }, message?: string) {
    if (title instanceof Error) {
      this.notify({ type: 'error', title: 'Error', message: title.message });
    } else if (typeof title === 'object' && title?.message) {
      this.notify({ type: 'error', title: 'Error', message: title.message });
    } else {
      this.notify({ type: 'error', title, message });
    }
  }

  warning(title: string, message?: string) {
    this.notify({ type: 'warning', title, message });
  }

  info(title: string, message?: string) {
    this.notify({ type: 'info', title, message });
  }
}

export const notification = new NotificationService();

export function useNotification() {
  return {
    toasts: notification.toasts,
    dismiss: notification.dismiss,
  };
}
