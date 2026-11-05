import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';

export async function exportReportPdf(
  report: string,
  filters: Record<string, string | number | undefined>,
  fileName: string,
): Promise<void> {
  try {
    const response = await apiClient.get('/reports/export', {
      params: { report, format: 'pdf', ...filters },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    notification.success('PDF report exported');
  } catch {
    notification.error('Could not export this report as PDF');
  }
}
