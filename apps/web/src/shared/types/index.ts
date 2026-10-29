export interface Product {
  id: string;
  name: string;
  code: string;
  sku: string;
  barcode?: string;
  description?: string;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  unitId: string;
  unitName: string;
  unitAbbreviation?: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  taxId?: string;
  isActive: boolean;
  imageUrl?: string;
  images?: { url: string; alt?: string; isPrimary?: boolean }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  color: string;
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  description?: string;
  website: string;
  logoUrl: string;
  isActive: boolean;
}

export interface Unit {
  id: string;
  name: string;
  code: string;
  abbreviation: string;
  isActive: boolean;
}

export interface Tax {
  id: string;
  name: string;
  code: string;
  rate: number;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  taxPin: string;
  paymentTerms: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
}

export interface StockLevel {
  productId: string;
  productName: string;
  productCode: string;
  productSku: string;
  categoryName?: string;
  brandName?: string;
  imageUrl?: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  reservedQuantity: number;
  available: number;
  lowStockThreshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: { name: string; code: string };
  status: string;
  total: number;
  expectedDeliveryDate?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
  }>;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Sale {
  id: string;
  number: string;
  total: number;
  status: string;
  createdAt: string;
  customerName?: string;
}

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface CashDrawerSession {
  id: string;
  status: 'OPEN' | 'CLOSED';
  openingFloat: number;
  closingFloat: number | null;
  totalSales: number;
  totalRefunds: number;
  totalCashIn: number;
  totalCashOut: number;
  expectedCash: number;
  countedCash: number | null;
  variance: number | null;
  openedAt: string;
  closedAt: string | null;
  movements?: CashMovement[];
}

export interface CashMovement {
  id: string;
  type: string;
  amount: number;
  referenceType?: string;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

export interface CashDrawerSummary {
  drawerId: string;
  name: string;
  session: CashDrawerSession;
}
