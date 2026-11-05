import type { Guide } from './guide-types';

/**
 * Written for shop staff. No terminal commands, no developer vocabulary.
 * Every `path` is a real route in `src/router/index.ts`.
 */
export const userGuide: Guide = {
  audience: 'user',
  title: 'User guide',
  description:
    'How to run a shop in SmartShopPOS, from the first sign-in to closing the day. No technical knowledge needed.',
  chapters: [
    {
      id: 'getting-started',
      title: 'Getting started',
      sections: [
        {
          id: 'create-account',
          title: 'Create your business account',
          summary: 'Register the business once. Everyone else is added by you afterwards.',
          path: '/register',
          steps: [
            {
              title: 'Fill in the business details',
              body: 'Enter the Organization Name exactly as you want it to appear on receipts, then choose a password for the owner account.',
            },
            {
              title: 'Fill in the owner details',
              body: 'Add the owner first name, last name and email. The phone number is optional but makes it easier to identify the account later.',
            },
            {
              title: 'Submit the form',
              body: 'You are signed in straight away, and a first branch called Head Office is created for you.',
            },
          ],
          notes: [
            'Registration creates an organization code from your business name plus a short random suffix, for example SHOP-4K2P. Write it down: it is part of every sign-in.',
            'The email address must be unique inside your business. Two different businesses may use the same email address.',
          ],
        },
        {
          id: 'sign-in',
          title: 'Sign in',
          summary: 'Sign-in takes three fields, not two.',
          path: '/login',
          steps: [
            {
              title: 'Enter the organization code',
              body: 'This tells SmartShopPOS which business you belong to. It is the code created at registration, not your email.',
            },
            {
              title: 'Enter your email and password',
              body: 'These are the details on your own staff account, which an owner or manager can create for you.',
            },
            {
              title: 'Submit',
              body: 'You land on the screen that matches your role: cashiers go to the till, managers to the dashboard, accountants to finance reports.',
            },
          ],
          notes: [
            'For your own safety the app signs you out every time the browser is fully closed and reopened. Signing in again is expected.',
            'If you only have a role and no account yet, ask an owner or administrator to create one for you under Administration -> Users.',
          ],
        },
        {
          id: 'set-up-shop',
          title: 'Set up the business',
          summary: 'Branch, tax rates and business identity before you start selling.',
          path: '/admin/organization',
          steps: [
            {
              title: 'Complete the organization profile',
              body: 'Business name, contact details and the receipt header. This is what customers see printed on their receipts.',
            },
            {
              title: 'Check the branches',
              body: 'Each till belongs to a branch. Use one branch per physical shop; stock and shifts are tracked separately per branch.',
            },
            {
              title: 'Confirm the tax rates',
              body: 'Check that the tax rate you actually charge is present and active before selling. A product with no tax rate is treated as untaxed.',
            },
          ],
        },
        {
          id: 'add-team',
          title: 'Add your team',
          summary: 'Create one account per person and give each the narrowest role that works.',
          path: '/admin/users',
          steps: [
            {
              title: 'Create the user',
              body: 'Add the person with their real name and work email, and choose a starting password.',
            },
            {
              title: 'Pick a role',
              body: 'Cashier for till operators, Manager for supervisors, Accountant for finance, Administrator for system settings. Roles decide which menus appear.',
            },
            {
              title: 'Hand over the details',
              body: 'Tell the person the organization code, their email and their password. They can sign in on any device in the shop.',
            },
          ],
          notes: [
            'Never share one account between staff. Sales and stock movements are stamped with the user who made them, which is what makes the audit trail worth having.',
          ],
        },
      ],
    },
    {
      id: 'catalog',
      title: 'Products',
      sections: [
        {
          id: 'add-product',
          title: 'Add a product',
          summary:
            'Every item you sell needs a product record with a code, a unit and a selling price.',
          path: '/products',
          steps: [
            {
              title: 'Start a new product',
              body: 'Give it a name your staff will recognise at the till, and a short code such as the barcode or your own item number.',
            },
            {
              title: 'Choose the unit',
              body: 'Piece, packet, kilogram, litre. The unit appears on receipts and decides how quantities are entered.',
            },
            {
              title: 'Enter the prices',
              body: 'Cost price is what you pay the supplier; selling price is what the customer pays. The cost price is what makes margin reporting possible later.',
            },
            {
              title: 'Attach a tax rate',
              body: 'Pick the rate you legally charge for this item. Leave it empty only if the item is genuinely not taxed.',
            },
          ],
          notes: [
            'Names, codes and SKUs must be unique within your business. Reusing one is the most common reason a product will not save.',
            'Loading a whole price list at once? Use Administration > Data instead of typing each item.',
          ],
        },
        {
          id: 'bulk-import',
          title: 'Load many products from Excel',
          summary:
            'Use a spreadsheet when you are opening a shop or moving an existing price list.',
          path: '/admin/data',
          steps: [
            {
              title: 'Download the template',
              body: 'Administration > Data has a Download template button. The file is stamped with your business name, a document number and the date, so you can always tell which version a colleague filled in.',
            },
            {
              title: 'Fill in the Products sheet',
              body: 'One product per row. Unit, Category, Brand and Tax Rate are dropdowns - if something is missing, add it under Catalog first and download a fresh template.',
            },
            {
              title: 'Choose the warehouse',
              body: 'The Opening Stock column lands in the warehouse you pick on the upload screen, so imported products are sellable straight away.',
            },
            {
              title: 'Upload and read the result',
              body: 'Rows that pass are created; rows that cannot be imported are listed with the reason and their spreadsheet row number, so you can fix them and try again.',
            },
          ],
          notes: [
            'Products that already exist are skipped, never overwritten - a second upload cannot change prices by accident.',
            'Every template download and every import is recorded in the Audit Center, with the file name and the number of rows created.',
          ],
        },
        {
          id: 'organise-catalog',
          title: 'Organise the catalogue',
          summary: 'Categories, brands and units keep a large catalogue searchable.',
          path: '/categories',
          steps: [
            {
              title: 'Create categories',
              body: 'Group products the way you think about them, for example Beverages, Household, Fresh Produce.',
            },
            {
              title: 'Add brands where they help',
              body: 'Useful when customers ask for a specific brand. Optional for shops with few branded items.',
            },
            {
              title: 'Settle on units early',
              body: 'Changing a unit after stock has moved is messy. Agree on the handful you need before loading products.',
            },
          ],
        },
      ],
    },
    {
      id: 'stock',
      title: 'Stock',
      sections: [
        {
          id: 'opening-stock',
          title: 'Record opening stock',
          summary: 'Tell the system what is physically on the shelf before the first sale.',
          path: '/inventory',
          steps: [
            {
              title: 'Count what is on the shelf',
              body: 'Do this before the first sale of the day, and before you start using the system at all.',
            },
            {
              title: 'Enter the quantities per product',
              body: 'Enter what is really there, not what the invoices say. Physical count wins.',
            },
            {
              title: 'Set low stock thresholds',
              body: 'On each product, set the level at which you want a warning. This drives the low stock report.',
            },
          ],
          notes: [
            'Until stock is recorded, the till will happily sell into negative stock. Opening stock is what makes the reports trustworthy.',
          ],
        },
        {
          id: 'receive-stock',
          title: 'Receive stock from a supplier',
          summary: 'Use a purchase order so cost and quantity are recorded together.',
          path: '/purchase-orders',
          steps: [
            {
              title: 'Raise the order',
              body: 'Add the supplier and the products with their quantities and agreed cost prices.',
            },
            {
              title: 'Receive against the order',
              body: 'When the delivery arrives, receive it against the order so stock increases and the cost is recorded in one step.',
            },
            {
              title: 'Check for late deliveries',
              body: 'The purchasing report lists orders that are still open or overdue, which is the fastest way to chase a supplier.',
            },
          ],
        },
      ],
    },
    {
      id: 'selling',
      title: 'Selling',
      sections: [
        {
          id: 'open-shift',
          title: 'Open the till',
          summary:
            'A shift is the period between opening and closing the drawer, and it holds the cash float.',
          path: '/shift',
          steps: [
            {
              title: 'Open a shift',
              body: 'Count the cash float you are starting with and enter it. Do not guess: the closing variance is measured against this number.',
            },
            {
              title: 'Go to the till',
              body: 'Once a shift is open, the point of sale screen becomes available to you.',
            },
          ],
          notes: [
            'The till is blocked while no shift is open. This is deliberate: every sale must belong to a counted drawer.',
          ],
        },
        {
          id: 'make-sale',
          title: 'Make a sale',
          summary: 'Find the product, take payment, hand over the receipt.',
          path: '/pos',
          steps: [
            {
              title: 'Add products',
              body: 'Search by name or scan a barcode. Check the quantity before moving on.',
            },
            {
              title: 'Attach the customer if you know them',
              body: 'Known customers get history and, if you use them, credit terms. Walk-in customers do not need an account.',
            },
            {
              title: 'Take payment',
              body: 'Choose the payment method actually used. Cash, card and mobile money are recorded separately, which is what makes the end of day check accurate.',
            },
            {
              title: 'Finish the sale',
              body: 'The receipt is generated from the sale and can be printed or handed over digitally.',
            },
          ],
          notes: [
            'Discounts follow the rules in the pricing settings; the till will refuse a discount beyond the limits your business set.',
          ],
        },
        {
          id: 'end-of-day',
          title: 'Close the day',
          summary: 'Count the drawer and let the system tell you the difference.',
          path: '/finance/closing',
          steps: [
            {
              title: 'Start the closing wizard',
              body: 'Work through the steps in order. Each one records something the day needs.',
            },
            {
              title: 'Enter the counted cash',
              body: 'Count the physical drawer and enter the total. The system compares it to what it expected from the day sales.',
            },
            {
              title: 'Explain any variance',
              body: 'If the amounts do not match, add a note. An unexplained variance is a problem for the owner, not something to hide.',
            },
          ],
        },
      ],
    },
    {
      id: 'reports',
      title: 'Reports',
      sections: [
        {
          id: 'read-reports',
          title: 'Read the reports',
          summary: 'Pick a date range, run the report, read the charts above the table.',
          path: '/reports',
          steps: [
            {
              title: 'Choose the report family',
              body: 'Sales, inventory, purchasing, customers or finance. Each opens its own set of reports.',
            },
            {
              title: 'Set the period',
              body: 'Every report takes a from and to date. Change either one and the report reloads on its own.',
            },
            {
              title: 'Read the charts, then the detail',
              body: 'The charts answer the obvious question at a glance - which till, which cashier, which supplier. The table below holds the rows behind the figures.',
            },
            {
              title: 'Export when you need to share',
              body: 'Export CSV to work in a spreadsheet, or PDF to send to an accountant or keep for records.',
            },
          ],
          notes: [
            'Profit and stock valuation are not shown yet: the data kept today does not preserve the cost snapshot needed for them, so any figure would be misleading.',
          ],
        },
        {
          id: 'audit-trail',
          title: 'Check what happened',
          summary: 'The audit centre records who changed what, including sign-ins.',
          path: '/admin/audit',
          steps: [
            {
              title: 'Search by date and user',
              body: 'Filter to the period and the person you are looking into.',
            },
            {
              title: 'Open the entry',
              body: 'Each entry shows the previous and new value, so a corrected price or a voided sale is visible rather than quietly gone.',
            },
          ],
          notes: [
            'Audit entries cannot be edited or deleted from the app. If something looks wrong, record it and tell the owner.',
          ],
        },
      ],
    },
  ],
};
