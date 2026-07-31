export const swaggerConfig = {
  exposeHeadRoutes: false,
  exposeUnsafeRoutes: false,
  openapi: {
    info: {
      title: 'SmartShopPOS API',
      description: 'Smart and Simple POS for everyone',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:4000/api/v1',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication and authorization' },
      { name: 'Categories', description: 'Product categories' },
      { name: 'Brands', description: 'Product brands' },
      { name: 'Units', description: 'Measurement units' },
      { name: 'Taxes', description: 'Tax rates' },
      { name: 'Products', description: 'Product catalog' },
      { name: 'Warehouses', description: 'Warehouse management' },
      { name: 'Suppliers', description: 'Supplier management' },
      { name: 'Inventory', description: 'Stock movements and adjustments' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Carts', description: 'Shopping cart operations' },
      { name: 'Sales', description: 'Sales transactions' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'Receipts', description: 'Receipt generation' },
      { name: 'Dashboard', description: 'Business metrics' },
      { name: 'Reports', description: 'Data reports and exports' },
      { name: 'Purchasing', description: 'Purchase orders and goods receipt' },
      { name: 'Cash Drawer', description: 'Cash drawer management and shifts' },
      { name: 'Finance', description: 'Expense and financial management' },
      { name: 'Banking', description: 'Bank accounts and transfers' },
      { name: 'Workflow', description: 'Approval workflows' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
};
