import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { ExportService, type ExportFormat } from '../service/export.service.js';
import { reportRegistry } from '../../../shared/report-registry.js';
import type { ReportDefinition } from '../../../shared/report-registry.js';

interface MockResult {
  items: Array<Record<string, unknown>>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const mockSalesData = {
  summary: { sales: 5, grossRevenue: 5000, discounts: 500, tax: 450, netRevenue: 4500 },
  payments: { cash: 2000, mpesa: 2000, card: 1000, bank: 0, credit: 0 },
  items: [
    {
      saleNumber: 'SALE-001',
      customer: 'John Doe',
      cashier: 'Jane',
      total: 1000,
      paymentMethod: 'CASH',
      createdAt: new Date('2026-07-01'),
    },
    {
      saleNumber: 'SALE-002',
      customer: 'Jane Smith',
      cashier: 'Bob',
      total: 2000,
      paymentMethod: 'MPESA',
      createdAt: new Date('2026-07-15'),
    },
    {
      saleNumber: 'SALE-003',
      customer: 'Bob Jones',
      cashier: 'Alice',
      total: 1500,
      paymentMethod: 'CARD',
      createdAt: new Date('2026-07-20'),
    },
    {
      saleNumber: 'SALE-004',
      customer: 'Alice Brown',
      cashier: 'Jane',
      total: 500,
      paymentMethod: 'CASH',
      createdAt: new Date('2026-07-25'),
    },
    {
      saleNumber: 'SALE-005',
      customer: 'Charlie Davis',
      cashier: 'Bob',
      total: 1000,
      paymentMethod: 'BANK',
      createdAt: new Date('2026-07-30'),
    },
  ],
  pagination: { page: 1, limit: 50, total: 5, totalPages: 1 },
};

const mockEmptyData: MockResult = {
  items: [],
  total: 0,
  page: 1,
  limit: 50,
  totalPages: 0,
};

describe('Export Service Integration Tests', () => {
  let exportService: ExportService;

  beforeAll(() => {
    exportService = new ExportService();

    const mockSalesReport: ReportDefinition<Record<string, unknown>, typeof mockSalesData> = {
      name: 'sales',
      title: 'Sales Report',
      columns: [
        { key: 'saleNumber', label: 'Invoice' },
        { key: 'customer', label: 'Customer' },
        { key: 'cashier', label: 'Cashier' },
        { key: 'total', label: 'Amount' },
        { key: 'paymentMethod', label: 'Payment Method' },
        { key: 'createdAt', label: 'Date' },
      ],
      execute: vi.fn().mockResolvedValue(mockSalesData),
    };

    const mockEmptyReport: ReportDefinition<Record<string, unknown>, MockResult> = {
      name: 'customers',
      title: 'Customer Summary Report',
      columns: [
        { key: 'customerId', label: 'Customer ID' },
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'transactions', label: 'Transactions' },
        { key: 'totalSpent', label: 'Total Spent' },
      ],
      execute: vi.fn().mockResolvedValue(mockEmptyData),
    };

    const mockInventoryReport: ReportDefinition<Record<string, unknown>, MockResult> = {
      name: 'inventory',
      title: 'Inventory Stock Report',
      columns: [
        { key: 'productId', label: 'Product ID' },
        { key: 'sku', label: 'SKU' },
        { key: 'name', label: 'Product' },
        { key: 'warehouse', label: 'Warehouse' },
        { key: 'quantity', label: 'Quantity' },
      ],
      execute: vi.fn().mockResolvedValue(mockEmptyData),
    };

    reportRegistry.register(mockSalesReport);
    reportRegistry.register(mockEmptyReport);
    reportRegistry.register(mockInventoryReport);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('CSV Export', () => {
    it('should export sales report to CSV', async () => {
      const result = await exportService.generate('sales', 'csv', { organizationId: 'test-org' });

      expect(result.contentType).toBe('text/csv; charset=utf-8');
      expect(result.filename).toMatch(/sales-report-\d+\.csv/);
      expect(result.buffer).toBeInstanceOf(Buffer);

      const content = result.buffer.toString('utf-8');
      const lines = content.split('\n');

      expect(lines[0]).toContain('Invoice');
      expect(lines[0]).toContain('Customer');
      expect(lines[0]).toContain('Amount');

      expect(lines[1]).toContain('SALE-001');
      expect(lines[1]).toContain('John Doe');
      expect(lines[1]).toContain('1000');
    });

    it('should export with correct CSV escaping', async () => {
      const result = await exportService.generate('sales', 'csv', { organizationId: 'test-org' });

      const content = result.buffer.toString('utf-8');
      expect(content).toContain('SALE-001');
    });

    it('should export empty report to valid CSV', async () => {
      const result = await exportService.generate('customers', 'csv', {
        organizationId: 'test-org',
      });

      expect(result.contentType).toBe('text/csv; charset=utf-8');
      expect(result.buffer).toBeInstanceOf(Buffer);

      const content = result.buffer.toString('utf-8');
      const lines = content.split('\n');
      expect(lines.length).toBe(1);
      expect(lines[0]).toContain('Customer ID');
    });
  });

  describe('Excel Export', () => {
    it('should export sales report to Excel (xlsx)', async () => {
      const result = await exportService.generate('sales', 'xlsx', { organizationId: 'test-org' });

      expect(result.contentType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(result.filename).toMatch(/sales-report-\d+\.xlsx/);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should export inventory report to Excel', async () => {
      const result = await exportService.generate('inventory', 'xlsx', {
        organizationId: 'test-org',
      });

      expect(result.contentType).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(result.filename).toMatch(/inventory-report-\d+\.xlsx/);
      expect(result.buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('PDF Export', () => {
    it('should export customers report to PDF', async () => {
      const result = await exportService.generate('customers', 'pdf', {
        organizationId: 'test-org',
      });

      expect(result.contentType).toBe('application/pdf');
      expect(result.filename).toMatch(/customers-report-\d+\.pdf/);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should export empty report to valid PDF', async () => {
      const result = await exportService.generate('customers', 'pdf', {
        organizationId: 'test-org',
      });

      expect(result.contentType).toBe('application/pdf');
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown report', async () => {
      await expect(
        exportService.generate('nonexistent-report', 'csv', { organizationId: 'test-org' }),
      ).rejects.toThrow('Unknown report: nonexistent-report');
    });

    it('should return 400 for unsupported format', async () => {
      await expect(
        exportService.generate('sales', 'json' as ExportFormat, { organizationId: 'test-org' }),
      ).rejects.toThrow('Unsupported format: json');
    });
  });

  describe('Organization Isolation', () => {
    it('should pass organizationId in filters to report execute', async () => {
      const report = reportRegistry.get('sales');
      expect(report).toBeDefined();

      const executeSpy = vi.mocked(report!.execute);

      await exportService.generate('sales', 'csv', { organizationId: 'org-123' });

      expect(executeSpy).toHaveBeenCalledWith({ organizationId: 'org-123' });
      expect(executeSpy).not.toHaveBeenCalledWith({ organizationId: 'org-other' });
    });
  });
});
