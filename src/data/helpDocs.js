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
    summary: 'Create, send, and track customer invoices.',
    sections: [
      {
        heading: 'Creating an invoice',
        steps: [
          'Open Invoices and click "New Invoice".',
          'Pick a client, add line items from inventory, and set the due date.',
          'Status flows: Draft → Pending → Paid. Overdue is set automatically past the due date.',
        ],
      },
      {
        heading: 'Statuses at a glance',
        steps: [
          'Paid — full payment recorded against the invoice.',
          'Pending — issued but not yet paid; still within due date.',
          'Overdue — past due date with a remaining balance.',
        ],
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    summary: 'Record incoming payments and reconcile invoices.',
    sections: [
      {
        heading: 'Recording a payment',
        steps: [
          'Go to Payments and click "Record Payment".',
          'Choose the invoice, enter the amount and payment method.',
          'Partial payments reduce the outstanding balance; the invoice closes when fully paid.',
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
            question: 'My data disappeared after a refresh — why?',
            answer:
              'This build is a demo workspace running in your browser. Records live in memory and reset when you reload. A persistent backend is on the roadmap.',
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
          {
            question: 'How do I mark an invoice as paid?',
            answer:
              'Go to Payments, click Record Payment, pick the invoice, and enter the full amount. The invoice status updates automatically.',
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
