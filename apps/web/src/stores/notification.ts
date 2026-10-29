import { toast } from 'vue-sonner';

class NotificationService {
  success(title: string, message?: string) {
    if (message) {
      toast.success(title, { description: message });
    } else {
      toast.success(title);
    }
  }

  error(title: string | Error | { message?: string }, message?: string) {
    if (title instanceof Error) {
      toast.error(title.message);
    } else if (typeof title === 'object' && title?.message) {
      toast.error(title.message);
    } else {
      if (message) {
        toast.error(title, { description: message });
      } else {
        toast.error(title);
      }
    }
  }

  warning(title: string, message?: string) {
    if (message) {
      toast.warning(title, { description: message });
    } else {
      toast.warning(title);
    }
  }

  info(title: string, message?: string) {
    if (message) {
      toast.info(title, { description: message });
    } else {
      toast.info(title);
    }
  }

  loading(title: string, message?: string) {
    if (message) {
      return toast.loading(title, { description: message });
    } else {
      return toast.loading(title);
    }
  }

  dismiss(toastId?: string | number) {
    if (toastId !== undefined) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }
}

export const notification = new NotificationService();
