export const helpTopics = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    summary: 'A quick tour of the Jubba ERP dashboard and its main sections.',
    sections: [
      {
        heading: 'Sign in and dashboard overview',
        steps: [
          'Use your work email and password on the Login screen to enter the workspace.',
          'The Dashboard shows live KPIs: Total Sales, Total Purchase, Pending Payments, and Low Stock Alerts.',
          'The left sidebar is your primary navigation. Click any item to switch sections.',
          'The topbar shows notifications, search, and your profile menu.',
        ],
      },
      {
        heading: 'Quick actions',
        steps: [
          'Use Add Client, Add Item, New Invoice, or Record Payment from the dashboard for fast entry.',
          'Each action opens a modal that pre-validates required fields before saving.',
        ],
      },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    summary: 'Add, edit, and manage customer records.',
    sections: [
      {
        heading: 'Adding a client',
        steps: [
          'Open the Clients page and click "Add Client".',
          'Fill in name, email, phone, and billing address.',
          'Set status to Active so the client appears in invoice dropdowns.',
        ],
      },
      {
        heading: 'Editing or removing',
        steps: [
          'Use the row actions to edit details or archive a client.',
          'Archived clients are hidden from new invoice flows but kept for history.',
        ],
      },
    ],
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    summary: 'Track vendors and their contact details.',
    sections: [
      {
        heading: 'Managing suppliers',
        steps: [
          'Open the Suppliers page from the sidebar.',
          'Add a supplier with company name, contact person, email, and phone.',
          'Linked purchase records appear under the supplier profile.',
        ],
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    summary: 'Track items, stock levels, and low-stock alerts.',
    sections: [
      {
        heading: 'Adding inventory items',
        steps: [
          'Go to Inventory and click "Add Item".',
          'Enter SKU, name, unit price, and current stock.',
          'Set a reorder threshold to power Low Stock alerts on the Dashboard.',
        ],
      },
      {
        heading: 'Stock alerts',
        steps: [
          'Items below the reorder threshold appear under Low Stock Alerts.',
          'The Dashboard shows the count; click through for the full list.',
        ],
      },
    ],
  },
  {
    id: 'invoices',
    label: 'Invoices',
    summary: 'Create invoices with discount, tax, upfront payment, and a promised next payment date.',
    sections: [
      {
        heading: 'Creating an invoice',
        steps: [
          'Open Invoices and click "Create Invoice".',
          'Pick a client, set the created date and due date.',
          'Add line items from inventory — you can only invoice what is in stock, and stock is deducted as soon as the invoice is created.',
          'Discount (%) and Tax (%) are pre-filled from the client\'s defaults but can be changed per invoice. The totals box shows subtotal → discount → tax → total live.',
          'Invoice numbers are assigned automatically in the JGC-MM-### format and never repeat.',
        ],
      },
      {
        heading: 'Payment section (paying now + next payment date)',
        steps: [
          'Tick "Client is paying an amount now" if the client hands over any amount at invoice time.',
          'Enter the Amount Received and pick the Payment Mode (Bank Transfer, Cash, Card, or Cheque). The totals box shows Paying Now and the remaining Balance Due.',
          'Use Next Payment Date to record when the client promised to pay the balance. It is optional and hides automatically if the amount received covers the full total.',
          'The upfront amount is saved as a real entry on the Payments page, and the invoice status becomes "partially paid" (or "paid" if it covers the full amount).',
          'The next payment date shows in the invoice list under the status, in the View dialog, and on the downloaded PDF next to Balance Due. It clears automatically once the invoice is fully paid.',
        ],
      },
      {
        heading: 'Statuses at a glance',
        steps: [
          'Pending — issued, nothing received yet.',
          'Partially paid — some amount received; the list shows how much is still due and the next payment date.',
          'Paid — full amount received; the PDF download becomes available.',
          'Overdue — past due date with a remaining balance.',
          'Cancelled — invoice voided; its stock returns to inventory.',
        ],
      },
      {
        heading: 'After creation',
        steps: [
          '"Mark Paid" settles the full remaining amount in one click.',
          'Deleting an invoice returns its quantities to inventory.',
          'Use View to see items, discount, tax, paid amount, balance due, and the next payment date.',
        ],
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    summary: 'Record incoming payments — upfront at invoice time or later from the Payments page.',
    sections: [
      {
        heading: 'Two ways to record a payment',
        steps: [
          'At invoice time — tick "Client is paying an amount now" in the Create Invoice dialog; the payment is recorded automatically.',
          'Later — go to Payments and click "Record Payment", choose the invoice, enter the amount and payment mode.',
        ],
      },
      {
        heading: 'How balances work',
        steps: [
          'A payment can never exceed the invoice\'s outstanding balance, and cancelled invoices do not accept payments.',
          'Partial payments set the invoice to "partially paid"; it becomes "paid" automatically when the running total covers the full amount.',
          'Deleting a payment recalculates the invoice\'s paid total and status.',
        ],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    summary: 'Sales, purchase, and aging reports for the business.',
    sections: [
      {
        heading: 'Available reports',
        steps: [
          'Sales Summary — totals by period, client, and status.',
          'Purchase Summary — totals by supplier and category.',
          'Aging Report — outstanding receivables grouped by 0–30, 31–60, 60+ days.',
        ],
      },
    ],
  },
  {
    id: 'users-roles',
    label: 'Users & Roles',
    summary: 'Invite teammates and control what each role can do.',
    sections: [
      {
        heading: 'Adding a user',
        steps: [
          'Go to Users & Roles and click "Add User".',
          'Enter full name, email, phone, password, role, and status.',
          'Email must be unique; password must be at least 6 characters.',
        ],
      },
      {
        heading: 'Roles',
        steps: [
          'Administrator — full access including Users & Roles and Settings.',
          'Manager — operational access to Clients, Inventory, Invoices, Payments, Reports.',
          'Accountant — invoice and payment access with read-only inventory.',
        ],
      },
    ],
  },
  {
    id: 'settings-audit',
    label: 'Settings & Audit Logs',
    summary: 'Workspace preferences and a full activity trail.',
    sections: [
      {
        heading: 'Settings',
        steps: [
          'Update company info, currency, and default tax rates.',
          'Changes apply across new invoices and reports.',
        ],
      },
      {
        heading: 'Audit Logs',
        steps: [
          'Every create, update, and delete is logged with the user and timestamp.',
          'Use filters to scope by user, action type, or date range.',
        ],
      },
    ],
  },
  {
    id: 'faq',
    label: 'FAQ',
    summary: 'Answers to the most common questions.',
    sections: [
      {
        heading: 'Frequently asked',
        faqs: [
          {
            question: 'The client paid only part of the invoice — how do I record that?',
            answer:
              'While creating the invoice, tick "Client is paying an amount now" and enter what they gave; add a Next Payment Date for the rest. For an existing invoice, record the partial amount from the Payments page. Either way the invoice shows as "partially paid" with the balance due.',
          },
          {
            question: 'Where do I see when a client promised to pay the balance?',
            answer:
              'The next payment date appears in the invoice list under the "partially paid" status, in the invoice View dialog, and on the downloaded PDF beside Balance Due. It clears automatically once the invoice is fully paid.',
          },
          {
            question: 'How do I mark an invoice as paid?',
            answer:
              'Click "Mark Paid" on the invoice row to settle the full remaining amount, or record the final payment from the Payments page — the status updates to "paid" automatically once the total is covered.',
          },
          {
            question: 'Why did my stock go down when I created an invoice?',
            answer:
              'Stock is committed at invoice time, not at payment time. Deleting or cancelling the invoice returns the quantities to inventory.',
          },
          {
            question: 'How do I change a user’s role?',
            answer:
              'Open Users & Roles, click the edit icon on the user row, change the Role field, and save.',
          },
          {
            question: 'Can I export reports?',
            answer:
              'CSV export is planned. For now, reports can be screenshot or printed via your browser’s print dialog.',
          },
        ],
      },
    ],
  },
];

export const helpSupport = {
  email: 'support@jubbagroup.com',
  phone: '+1 (555) 010-2024',
  hours: 'Mon – Fri, 9:00 AM – 6:00 PM',
};
