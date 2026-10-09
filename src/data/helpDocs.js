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
    summary: 'Add suppliers, record what they supply, attach their invoice, and pay them in installments.',
    sections: [
      {
        heading: 'Adding a supplier',
        steps: [
          'Open Suppliers from the sidebar and click "Add Supplier".',
          'Enter the supplier name, company, email, phone, and address, then save.',
        ],
      },
      {
        heading: 'Recording a supply',
        steps: [
          'Switch to the "Supply Activities" tab and click "Record Supply".',
          'Pick the supplier, enter the item, quantity, and price per unit. The total is calculated for you.',
          'Enter the supplier\'s invoice number if they gave you one.',
          'Use "Attach Supplier Invoice" to upload the bill the supplier gave you (PDF, PNG, JPG, or WEBP, up to 5 MB). This is optional.',
          'Enter "Amount Paid Now" if you paid something on the spot. If money is still owed, pick a Next Payment Date. You get a reminder 3 days before that date and again if it passes unpaid.',
          'Recording a supply does not add stock to Inventory.',
        ],
      },
      {
        heading: 'Paying a supplier in installments',
        steps: [
          'Any supply that is unpaid or partly paid shows an "Add Payment" button, on the Supply Activities tab and on the Payments page under Supplier Payments.',
          'Enter the amount you are paying now (it is pre-filled with the remaining balance), the payment date, and a reference such as a cheque or transaction number.',
          'Use "Attach Invoice / Receipt" to upload the supplier\'s receipt for this payment. Each payment keeps its own file.',
          'If a balance is still left, pick the next payment date. The status changes from Unpaid to Partially Paid, and to Paid once the full amount is covered.',
        ],
      },
      {
        heading: 'Viewing attached invoices',
        steps: [
          'Rows that have an attached file show a small eye icon next to the invoice number or reference.',
          'Click the eye icon to open the file in a new tab. Rows without a file show no icon.',
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
    summary: 'Create invoices, take part payments, track overdue amounts, and download the invoice PDF.',
    sections: [
      {
        heading: 'Creating an invoice',
        steps: [
          'Open Invoices and click "Create Invoice".',
          'Pick a client, set the created date and due date.',
          'Add line items from inventory. You can only invoice what is in stock, and stock is deducted as soon as the invoice is created.',
          'Discount (%) and Tax (%) are pre-filled from the client\'s defaults but can be changed per invoice. The totals box shows subtotal, discount, tax, and total as you type.',
          'Invoice numbers are assigned automatically in the JGC-MM-### format and never repeat.',
        ],
      },
      {
        heading: 'Taking a payment at invoice time',
        steps: [
          'Tick "Client is paying an amount now" if the client hands over any amount when the invoice is created.',
          'Enter the Amount Received and pick the Payment Mode (Bank Transfer, Cash, Card, or Cheque). The totals box shows the amount paying now and the balance due.',
          'Use Next Payment Date to record when the client promised to pay the rest. It hides automatically if the amount covers the full total.',
          'The amount is saved as a real payment on the Payments page.',
        ],
      },
      {
        heading: 'Statuses at a glance',
        steps: [
          'Pending: issued, nothing received yet.',
          'Partially paid: some amount received. The list shows how much is still due and the next payment date under the status.',
          'Overdue: the due date has passed with money still owed. The list shows the overdue amount and how many days late it is, for example "$300.26 overdue · 32 days late".',
          'Paid: the full amount has been received.',
          'Cancelled: the invoice is voided and its stock returns to inventory.',
        ],
      },
      {
        heading: 'Mark Paid',
        steps: [
          '"Mark Paid" settles whatever is still owed on the invoice in one click.',
          'It also records that remaining amount as a Cash payment with the reference "Marked as paid", so the Payments page always matches the invoice.',
          'If the client actually paid by bank transfer, card, or cheque, use Record Payment on the Payments page instead so the correct mode is saved.',
        ],
      },
      {
        heading: 'Downloading the invoice PDF',
        steps: [
          'The download icon is available on every invoice that is not cancelled, whether it is unpaid, partly paid, or paid.',
          'If the invoice has payments, the PDF has one page per payment. For example, an invoice paid in two parts downloads as a 2-page PDF.',
          'Each page shows the same goods and invoice total, plus that payment\'s number (such as "Payment 1 of 2"), date, mode, and reference, the amount paid before it, the amount of this payment, and the balance due after it.',
          'An invoice with no payments yet downloads as a single page showing the full amount.',
        ],
      },
      {
        heading: 'After creation',
        steps: [
          'Use View to see items, discount, tax, paid amount, balance due, and the next payment date.',
          'Deleting an invoice returns its quantities to inventory.',
        ],
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    summary: 'Client receipts and supplier payouts, each in its own section.',
    sections: [
      {
        heading: 'Client and supplier sections',
        steps: [
          'The Payments page has two buttons below the summary cards: "Client Payments" and "Supplier Payments". Click one to switch sections. The number on each button is how many payments it holds.',
          'The summary cards change with the section you pick.',
        ],
      },
      {
        heading: 'Client Payments',
        steps: [
          'Cards show Received from Clients, Total Payments, Pending Invoices, and Due from Clients (the total still owed across all invoices).',
          'The table lists every client payment with the invoice, client, goods bought (for example "36 × Mouse"), date, amount, mode, and reference.',
          '"Due Now" shows what is still owed on that payment\'s invoice today. It is red while money is due and shows a green "Paid" once the invoice is settled. Two payments on the same invoice show the same amount, because it is one balance.',
          'To record a payment, click "Record Payment", choose the invoice (it pre-fills the remaining balance), enter the amount, mode, reference, and date. A payment can never be more than the balance still due.',
        ],
      },
      {
        heading: 'Supplier Payments',
        steps: [
          'Cards show Paid to Suppliers, Still Owed to Suppliers, and Supplies Not Fully Paid.',
          '"Pending Supplier Payments" lists every supply that is unpaid or partly paid, with total, paid, remaining, next payment date, and status. Click "Add Payment" on a row to pay the next installment and attach the supplier\'s receipt.',
          '"Supplier Payment History" lists every installment paid. Click the eye icon next to a reference to open the attached supplier invoice or receipt.',
        ],
      },
      {
        heading: 'How balances work',
        steps: [
          'Partial payments set an invoice to "partially paid". It becomes "paid" automatically when the payments add up to the full total.',
          'Cancelled invoices do not accept payments.',
          'Deleting a payment recalculates the invoice\'s paid total and status.',
        ],
      },
    ],
  },
  {
    id: 'client-portal',
    label: 'Client Portal',
    summary: 'What a client sees when they log in with their own account.',
    sections: [
      {
        heading: 'Client logins',
        steps: [
          'Every client you add gets their own login. A client only sees their own invoices and payments, never other clients or internal sections.',
          'If an invoice is overdue, a red banner at the top of their Invoices page shows how much is past due.',
        ],
      },
      {
        heading: 'What a client can do',
        steps: [
          'Invoices: see each invoice with its status, the overdue amount and days late, and download the PDF (one page per payment).',
          'Payments: see "My Payments" with what they have paid, the goods each payment was for, how much is still due, and their total amount due.',
          'Clients cannot record payments, mark invoices paid, or delete anything.',
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
    id: 'currency',
    label: 'Currency & Region',
    summary: 'Bill clients abroad in their own currency, take payments in another currency, and see totals in one base currency.',
    sections: [
      {
        heading: 'Setting up currencies',
        steps: [
          'Go to Settings -> Currency & Region (Administrator).',
          'The base currency (USD by default) is what the dashboard, reports and all totals are shown in. It cannot change once invoices, payments or supplies exist.',
          'Add each currency you bill or get paid in with its code (e.g. SOS), name, symbol, and rate. The rate is how many units of that currency equal 1 base currency, e.g. 1 USD = 571 SOS.',
          'Decimals and Date Format control how every amount and date is shown across the panel and on the PDF.',
          'Update rates whenever they move. New invoices, payments and supplies save the rate in use, so changing a rate never changes old records.',
        ],
      },
      {
        heading: 'Billing a client in another currency',
        steps: [
          'Open the client and pick a Billing Currency. New invoices for that client start in it automatically.',
          'In Create Invoice, the Currency and Rate fields appear once an item is added. Inventory prices are in the base currency and are converted at the rate shown; you can change the currency or rate for that invoice.',
          'The invoice, its list row, the View dialog and the PDF all show that currency (for example "Sh 114,200.00", with "SOMALI SHILLINGS" in the amount in words).',
        ],
      },
      {
        heading: 'Payment in a different currency',
        steps: [
          'In Record Payment, tick "Client paid in a different currency".',
          'Pick the currency handed over, enter the amount, and check the rate (pre-filled from Settings, shown the readable way round such as 1 USD = 571 SOS).',
          'The form shows exactly how much will be credited to the invoice. The payment is saved in the invoice currency and the list shows what was handed over, e.g. "Sh 57,100.00 paid as $100.00".',
        ],
      },
      {
        heading: 'Supplier supplies',
        steps: [
          'Record Supply has a Currency field. The price, total and every installment for that supply are in that currency.',
          'Supplier totals on the Suppliers page and the Payments summary cards are converted to the base currency.',
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
            question: 'The client paid only part of the invoice. How do I record that?',
            answer:
              'While creating the invoice, tick "Client is paying an amount now" and enter what they gave, then add a Next Payment Date for the rest. For an existing invoice, use Record Payment on the Payments page. Either way the invoice shows as "partially paid" with the balance due.',
          },
          {
            question: 'Why does the money received not match the value of the goods sold?',
            answer:
              'The client pays the invoice total, which is the goods value minus any discount plus any tax. Any invoice that is not fully paid also leaves a balance. The "Due from Clients" card on the Payments page shows exactly how much is still owed.',
          },
          {
            question: 'How do I download an invoice for a partial payment?',
            answer:
              'Click the download icon on the invoice in the Invoices list. The PDF has one page per payment, and each page shows that payment and the balance left after it.',
          },
          {
            question: 'I clicked Mark Paid. Why is there a new Cash payment?',
            answer:
              'Mark Paid records the remaining amount as a Cash payment with the reference "Marked as paid" so the invoice and the Payments page always agree. If the client paid another way, record it with Record Payment instead.',
          },
          {
            question: 'Where do I see what a supplier\'s bill or receipt looked like?',
            answer:
              'Attach the file when you record the supply or add a supplier payment. Then click the eye icon on that row, on the Suppliers page or in Supplier Payment History on the Payments page.',
          },
          {
            question: 'Why did my stock go down when I created an invoice?',
            answer:
              'Stock is committed at invoice time, not at payment time. Deleting or cancelling the invoice returns the quantities to inventory.',
          },
          {
            question: 'How do I change a user\u2019s role?',
            answer:
              'Open Users & Roles, click the edit icon on the user row, change the Role field, and save.',
          },
          {
            question: 'Can I export reports?',
            answer:
              'CSV export is planned. For now, reports can be screenshot or printed via your browser\u2019s print dialog.',
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
