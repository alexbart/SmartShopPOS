import { computed, ref } from 'vue';
import { apiClient } from '@/shared/lib/api-client';
import { notification } from '@/stores/notification';

/**
 * Drives the product workbook import: read a local file as base64, hand it to
 * the API, then pump the job in small batches so the page can show real
 * progress instead of one long silent request.
 */

const BATCH_ROWS = 25;
/** Hard stop so a job that never settles cannot pin the browser in a loop. */
const MAX_BATCHES = 400;

export type ProductImportJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

export interface ProductImportRowResult {
  rowNumber: number;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  error?: string | null;
}

export interface ProductImportJobResult {
  jobId: string;
  status: ProductImportJobStatus;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  results: ProductImportRowResult[];
}

const TERMINAL_STATUSES: ProductImportJobStatus[] = ['COMPLETED', 'FAILED', 'PARTIAL'];

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      // Strip the data URL prefix; the API accepts either form.
      resolve(result.includes(',') ? result.slice(result.indexOf(',') + 1) : result);
    };
    reader.onerror = () => reject(new Error('That file could not be read. Try re-selecting it.'));
    reader.readAsDataURL(file);
  });
}

async function saveBlob(path: string, fallbackName: string) {
  const response = await apiClient.get(path, { responseType: 'blob' });
  const disposition = response.headers['content-disposition'] as string | undefined;
  const fileName = /filename="?([^";]+)"?/.exec(disposition ?? '')?.[1] ?? fallbackName;

  const url = URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);

  return fileName;
}

export function useDataTransfer() {
  const downloading = ref<string | null>(null);
  const importing = ref(false);
  const processed = ref(0);
  const total = ref(0);
  const result = ref<ProductImportJobResult | null>(null);

  const progressPercent = computed(() => {
    if (total.value === 0) return importing.value ? 5 : 0;
    return Math.min(100, Math.round((processed.value / total.value) * 100));
  });

  const problemRows = computed(
    () => result.value?.results.filter((row) => row.status !== 'SUCCESS') ?? [],
  );

  async function downloadTemplate() {
    downloading.value = 'template';
    try {
      const fileName = await saveBlob('/products/import/template', 'products-import-template.xlsx');
      notification.success(`${fileName} downloaded - this export is logged in the Audit Center`);
    } finally {
      downloading.value = null;
    }
  }

  async function downloadReport(report: string, label: string) {
    downloading.value = report;
    try {
      const fileName = await saveBlob(
        `/reports/export?report=${encodeURIComponent(report)}&format=xlsx`,
        `${report}-report.xlsx`,
      );
      notification.success(`${label} exported as ${fileName}`);
    } finally {
      downloading.value = null;
    }
  }

  async function importWorkbook(file: File, warehouseId: string) {
    importing.value = true;
    processed.value = 0;
    total.value = 0;
    result.value = null;

    try {
      const contentBase64 = await readAsBase64(file);
      const uploaded = await apiClient.post('/products/import/upload', {
        warehouseId,
        fileName: file.name,
        contentBase64,
      });

      const { jobId, totalRows } = (uploaded.data as { data: { jobId: string; totalRows: number } })
        .data;
      total.value = totalRows;

      let latest = uploaded.data.data as ProductImportJobResult;
      for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
        const processedResponse = await apiClient.post(`/products/import/${jobId}/process`, {
          limit: BATCH_ROWS,
        });
        latest = (processedResponse.data as { data: ProductImportJobResult }).data;
        processed.value = latest.processedRows;
        total.value = latest.totalRows;
        if (TERMINAL_STATUSES.includes(latest.status)) break;
      }

      result.value = latest;

      if (latest.successfulRows > 0 && latest.failedRows === 0) {
        notification.success(`Imported ${latest.successfulRows} product(s)`);
      } else if (latest.successfulRows > 0) {
        notification.warning(
          `Imported ${latest.successfulRows} product(s); ${latest.failedRows + latest.skippedRows} row(s) need attention`,
        );
      } else {
        notification.error('No products were imported - check the row errors below');
      }

      return latest;
    } finally {
      importing.value = false;
    }
  }

  function resetResult() {
    result.value = null;
    processed.value = 0;
    total.value = 0;
  }

  return {
    downloading,
    importing,
    processed,
    total,
    progressPercent,
    result,
    problemRows,
    downloadTemplate,
    downloadReport,
    importWorkbook,
    resetResult,
  };
}
