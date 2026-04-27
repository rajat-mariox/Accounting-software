import React from 'react';

function Icon({ children, className = 'dashboard-icon', viewBox = '0 0 24 24' }) {
  return (
    <svg viewBox={viewBox} className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export function DashboardIcon() {
  return (
    <Icon>
      <path d="M4 11.7V6.9A1.9 1.9 0 0 1 5.9 5h4.3v6.7H4Zm10-6.7h4.1A1.9 1.9 0 0 1 20 6.9v2.8h-6V5Zm-10 8.2h6v6.8H5.9A1.9 1.9 0 0 1 4 18.1v-1.6Zm10 0h6V18a2 2 0 0 1-2 2h-4v-6.8Z" fill="currentColor" />
    </Icon>
  );
}

export function ClientsIcon() {
  return (
    <Icon>
      <path d="M12 12.1a4.1 4.1 0 1 0-4.1-4.1 4.1 4.1 0 0 0 4.1 4.1Zm-6.8 8a6.8 6.8 0 0 1 13.6 0v.9H5.2v-.9Z" fill="currentColor" />
    </Icon>
  );
}

export function SuppliersIcon() {
  return (
    <Icon>
      <path d="M5 6.5h14V9H5Zm0 4.6h14V13H5Zm0 4.6h14v2.5H5Z" fill="currentColor" />
    </Icon>
  );
}

export function InventoryIcon() {
  return (
    <Icon>
      <path d="M12 4.6 19 8v8l-7 3.4-7-3.4V8l7-3.4Zm0 2.7L8 8.9l4 2 4-2-4-1.6Z" fill="currentColor" />
    </Icon>
  );
}

export function WarehouseIcon() {
  return (
    <Icon>
      <path d="M12 4.8 18.7 8v8L12 19.2 5.3 16V8L12 4.8Zm0 2.1L8.4 8.7 12 10.3l3.6-1.6L12 6.9Zm-4 2.5v5.1l3.2 1.6V11ZM16 9.4 12.8 11v3.6l3.2-1.6Z" fill="currentColor" />
    </Icon>
  );
}

export function InvoicesIcon() {
  return (
    <Icon>
      <path d="M7.2 4.8h9.6A2.2 2.2 0 0 1 19 7v12l-2.1-1.3-1.8 1.3-2-1.3-1.9 1.3-2-1.3L8 20V7a2.2 2.2 0 0 1 2.2-2.2Zm1.3 4.3h7V7.3h-7Zm0 3.8h7v-1.8h-7Zm0 3.8H14v-1.8H8.5Z" fill="currentColor" />
    </Icon>
  );
}

export function PaymentsIcon() {
  return (
    <Icon>
      <path d="M6.5 6.8h11A2.5 2.5 0 0 1 20 9.3v6.1a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 15.4V9.3a2.5 2.5 0 0 1 2.5-2.5Zm10.8 4.3v1.3h-2.4a.7.7 0 1 1 0-1.3h2.4Z" fill="currentColor" />
    </Icon>
  );
}

export function ReportsIcon() {
  return (
    <Icon>
      <path d="M6.2 5.2h11.6A1.7 1.7 0 0 1 19.5 6.9v10.2a1.7 1.7 0 0 1-1.7 1.7H6.2a1.7 1.7 0 0 1-1.7-1.7V6.9a1.7 1.7 0 0 1 1.7-1.7Zm1.6 11.1h2.1V11H7.8v5.3Zm4 0h2.1V8.5h-2.1v7.8Zm4 0h2.1v-3.8h-2.1v3.8Z" fill="currentColor" />
    </Icon>
  );
}

export function SettingsIcon() {
  return (
    <Icon>
      <path d="M13.1 4.6a1.2 1.2 0 0 0-2.2 0l-.4 1a7.6 7.6 0 0 0-1.8 1.1l-1-.1a1.2 1.2 0 0 0-1.2.6l-1 1.8a1.2 1.2 0 0 0 .2 1.3l.7.7c-.1.5-.1 1.1 0 1.7l-.7.7a1.2 1.2 0 0 0-.2 1.3l1 1.8c.3.5.8.8 1.4.7l1-.1c.6.4 1.2.8 1.8 1.1l.4 1a1.2 1.2 0 0 0 2.2 0l.4-1c.6-.3 1.2-.7 1.8-1.1l1 .1c.6.1 1.1-.2 1.4-.7l1-1.8a1.2 1.2 0 0 0-.2-1.3l-.7-.7c.1-.6.1-1.2 0-1.7l.7-.7a1.2 1.2 0 0 0 .2-1.3l-1-1.8a1.2 1.2 0 0 0-1.2-.6l-1 .1a7.6 7.6 0 0 0-1.8-1.1Zm-.1 10.1A2.5 2.5 0 1 1 15.5 12a2.5 2.5 0 0 1-2.5 2.7Z" fill="currentColor" />
    </Icon>
  );
}

export function AuditLogsIcon() {
  return (
    <Icon>
      <path d="M7 4.8h10a1.7 1.7 0 0 1 1.7 1.7v10.9a1.7 1.7 0 0 1-1.7 1.7H7a1.7 1.7 0 0 1-1.7-1.7V6.5A1.7 1.7 0 0 1 7 4.8Zm1.2 4h7.6V7.4H8.2Zm0 3.6h7.6v-1.4H8.2Zm0 3.6h5.2v-1.4H8.2Z" fill="currentColor" />
    </Icon>
  );
}

export function HelpIcon() {
  return (
    <Icon>
      <path d="M12 4.5a7.5 7.5 0 1 0 7.5 7.5A7.5 7.5 0 0 0 12 4.5Zm0 12.3a1 1 0 1 1 1-1 1 1 0 0 1-1 1Zm1-3.5v.5h-2v-.8a2.8 2.8 0 1 1 4.3-2.4 2.6 2.6 0 0 1-1.5 2.4 1 1 0 0 0-.8.9Z" fill="currentColor" />
    </Icon>
  );
}

export function AddClientIcon() {
  return (
    <Icon>
      <path d="M12 11.4a3.5 3.5 0 1 0-3.5-3.5 3.5 3.5 0 0 0 3.5 3.5Zm-6.2 7.8a6.2 6.2 0 0 1 12.4 0v.3H5.8Zm12.9-7.7h1.8v2.2h2.2v1.8h-2.2v2.2h-1.8v-2.2h-2.2v-1.8h2.2Z" fill="currentColor" />
    </Icon>
  );
}

export function AddItemIcon() {
  return (
    <Icon>
      <path d="M12 4.7 18.2 8v8L12 19.3 5.8 16V8L12 4.7Zm0 2.7L8.4 9.3 12 11l3.6-1.7Z" fill="currentColor" />
    </Icon>
  );
}

export function NewInvoiceIcon() {
  return (
    <Icon>
      <path d="M7.3 4.7h9.4A2.3 2.3 0 0 1 19 7v11.4l-2.1-1.3-1.8 1.3-2-1.3-1.9 1.3-2-1.3L8 19V7a2.3 2.3 0 0 1 2.3-2.3Zm1.5 4.1h6.4V7.3H8.8Zm0 3.6h6.4v-1.6H8.8Zm0 3.6h4.3v-1.6H8.8Z" fill="currentColor" />
    </Icon>
  );
}

export function DownloadIcon() {
  return (
    <Icon>
      <path d="M11 4.8h2v7l2.6-2.6 1.4 1.4L12 16.6 7 10.6l1.4-1.4L11 11.8Zm-4.2 10h10.4v1.8H6.8Z" fill="currentColor" />
    </Icon>
  );
}

export function ViewIcon() {
  return (
    <Icon>
      <path d="M12 5c4.5 0 8.2 3.3 9.5 7-1.3 3.7-5 7-9.5 7s-8.2-3.3-9.5-7c1.3-3.7 5-7 9.5-7Zm0 2c-3.3 0-6.1 2.4-7.2 5 1.1 2.6 3.9 5 7.2 5s6.1-2.4 7.2-5c-1.1-2.6-3.9-5-7.2-5Zm0 1.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4Z" fill="currentColor" />
    </Icon>
  );
}

export function CalendarIcon() {
  return (
    <Icon>
      <path d="M7 5h1.8v1.6H7Zm8.2 0H17v1.6h-1.8ZM6.2 7.8h11.6A1.2 1.2 0 0 1 19 9v9.2a1.2 1.2 0 0 1-1.2 1.2H6.2A1.2 1.2 0 0 1 5 18.2V9a1.2 1.2 0 0 1 1.2-1.2ZM6.8 11h10.4V9.6H6.8Zm0 2.8h10.4v4H6.8Z" fill="currentColor" />
    </Icon>
  );
}

export function InvoiceDocIcon() {
  return (
    <Icon>
      <path d="M7.2 4.8h7.7L19 8.9v10.3a1.3 1.3 0 0 1-1.3 1.3H7.2A1.3 1.3 0 0 1 5.9 19V6.1a1.3 1.3 0 0 1 1.3-1.3Zm6.8 1.9v2.9h2.9ZM8 10h6v1.5H8Zm0 3.2h6v1.5H8Zm0 3.2h4.4v1.5H8Z" fill="currentColor" />
    </Icon>
  );
}

export function PaidInvoiceIcon() {
  return (
    <Icon>
      <path d="M12 5.2a6.8 6.8 0 1 0 6.8 6.8A6.8 6.8 0 0 0 12 5.2Zm-.9 9.3-2.1-2.1 1.1-1.1 1 1 3-3 1.1 1.1Z" fill="currentColor" />
    </Icon>
  );
}

export function PendingInvoiceIcon() {
  return (
    <Icon>
      <path d="M12 5.2a6.8 6.8 0 1 0 6.8 6.8A6.8 6.8 0 0 0 12 5.2Zm0 3.1v3.7l2.7 1.6-1 1.5-3.7-2.1V8.3Z" fill="currentColor" />
    </Icon>
  );
}

export function PaymentDollarIcon() {
  return (
    <Icon>
      <path d="M12 5a7 7 0 1 0 7 7 7 7 0 0 0-7-7Zm1.2 10.2v1.1h-2.4v-1a3.5 3.5 0 0 1-1.5-.9l1-1.1a2.4 2.4 0 0 0 1.5.5c.6 0 1-.2 1-.6s-.6-.7-1.3-1c-1.1-.4-2.4-.9-2.4-2.4a2.4 2.4 0 0 1 1.7-2.2V6.1h2.4v1a3.3 3.3 0 0 1 1.3.8l-1 1a2 2 0 0 0-1.3-.4c-.6 0-1 .2-1 .6s.7.7 1.4 1c1.1.4 2.4.9 2.4 2.3a2.5 2.5 0 0 1-1.8 2.4Z" fill="currentColor" />
    </Icon>
  );
}

export function ReceiptIcon() {
  return (
    <Icon>
      <path d="M7.2 4.8h9.6A1.4 1.4 0 0 1 18.2 6.2v12.8l-1.8-1-1.7 1-1.7-1-1.7 1-1.7-1-1.7 1-1.7-1V6.2a1.4 1.4 0 0 1 1.4-1.4Zm1.2 3h7.2V6.4H8.4Zm0 3.1h7.2V9.3H8.4Zm0 3.1H13v-1.5H8.4Z" fill="currentColor" />
    </Icon>
  );
}

export function UploadIcon() {
  return (
    <Icon>
      <path d="M11 15.2h2V9.9l1.9 1.9 1.4-1.4L12 6 7.7 10.4l1.4 1.4L11 9.9Zm-3.8 2.6h9.6v1.8H7.2Z" fill="currentColor" />
    </Icon>
  );
}

export function BankTransferIcon() {
  return (
    <Icon>
      <path d="M6 8.2h8.6L12.8 6.4l1.2-1.2 3.8 3.8L14 12.8l-1.2-1.2 1.8-1.8H6Zm12 7.6H9.4l1.8 1.8-1.2 1.2-3.8-3.8 3.8-3.8 1.2 1.2-1.8 1.8H18Z" fill="currentColor" />
    </Icon>
  );
}

export function FilterIcon() {
  return (
    <Icon>
      <path d="M4.8 6.2h14.4L14.4 12v4.8l-4.8 2V12L4.8 6.2Z" fill="currentColor" />
    </Icon>
  );
}

export function RecordPaymentIcon() {
  return (
    <Icon>
      <path d="M12 4.8a7.2 7.2 0 1 0 7.2 7.2A7.2 7.2 0 0 0 12 4.8Zm1.3 10.8v1.1h-2.6v-1a3.8 3.8 0 0 1-1.8-1l1-1.2a2.4 2.4 0 0 0 1.7.7c.6 0 1.2-.2 1.2-.7s-.6-.8-1.3-1c-1.2-.4-2.8-.9-2.8-2.7a2.6 2.6 0 0 1 1.9-2.4V6.2h2.6v1a3.5 3.5 0 0 1 1.5.9l-1 1.1a2.4 2.4 0 0 0-1.4-.5c-.7 0-1.1.2-1.1.6s.7.8 1.5 1.1c1.2.4 2.6.9 2.6 2.6a2.7 2.7 0 0 1-2 2.6Z" fill="currentColor" />
    </Icon>
  );
}

export function SalesMetricIcon() {
  return (
    <Icon>
      <path d="M5 17.5h14v1.8H5Zm1.5-2.2h2.4V9.7H6.5Zm4.3 0h2.4V6.5h-2.4Zm4.3 0h2.4V11h-2.4Z" fill="currentColor" />
    </Icon>
  );
}

export function PurchaseMetricIcon() {
  return (
    <Icon>
      <path d="M5 6.4h14v2H5Zm1.4 3.6h11.2v8.2H6.4Zm2.2 2h2v4.2h-2Zm4 0h2v4.2h-2Z" fill="currentColor" />
    </Icon>
  );
}

export function PendingMetricIcon() {
  return (
    <Icon>
      <path d="M12 5a7 7 0 1 0 7 7 7 7 0 0 0-7-7Zm1 3.3v3.5l2.6 1.5-1 1.6-3.6-2.1V8.3Z" fill="currentColor" />
    </Icon>
  );
}

export function StockMetricIcon() {
  return (
    <Icon>
      <path d="M6.5 7.2h11v9.6h-11Zm1.8 1.8v2h7.4V9Zm0 3.2v2h4.6v-2Z" fill="currentColor" />
    </Icon>
  );
}

export function WarningIcon() {
  return (
    <Icon>
      <path d="M12 4.6 20 18H4L12 4.6Zm0 3.5a.8.8 0 0 0-.8.8v4.2a.8.8 0 1 0 1.6 0V8.9a.8.8 0 0 0-.8-.8Zm0 7.1a1 1 0 1 0 1 1 1 1 0 0 0-1-1Z" fill="currentColor" />
    </Icon>
  );
}

export function InvoiceAlertIcon() {
  return (
    <Icon>
      <path d="M7.3 4.8h9.4A2.3 2.3 0 0 1 19 7v11.2l-2.1-1.3-1.8 1.3-2-1.3-1.9 1.3-2-1.3L8 19V7a2.3 2.3 0 0 1 2.3-2.2Zm1.4 4.2h6.6V7.4H8.7Zm0 3.6h6.6v-1.7H8.7Zm0 3.6h4.4v-1.7H8.7Z" fill="currentColor" />
    </Icon>
  );
}

export function SearchIcon() {
  return (
    <Icon>
      <path d="M10.7 4.5a6.2 6.2 0 1 1 0 12.4 6.2 6.2 0 0 1 0-12.4Zm0 2.1a4.1 4.1 0 1 0 0 8.2 4.1 4.1 0 0 0 0-8.2Zm8.2 11.4-3.3-3.3 1.5-1.5 3.3 3.3a1 1 0 0 1-1.5 1.5Z" fill="currentColor" />
    </Icon>
  );
}

export function BellIcon() {
  return (
    <Icon>
      <path d="M12 4.5a5 5 0 0 1 5 5v2.3c0 1.1.3 2.1.9 3l1 1.5a1 1 0 0 1-.8 1.5H5.9a1 1 0 0 1-.8-1.5l1-1.5c.6-.9.9-1.9.9-3V9.5a5 5 0 0 1 5-5Zm0 15.1a2.2 2.2 0 0 1-2.1-1.5h4.2A2.2 2.2 0 0 1 12 19.6Z" fill="currentColor" />
    </Icon>
  );
}

export function ChevronRightIcon() {
  return (
    <Icon>
      <path d="m10 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function ChevronDownIcon() {
  return (
    <Icon>
      <path d="m7 9 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function CloseIcon() {
  return (
    <Icon>
      <path d="m7 7 10 10m0-10L7 17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </Icon>
  );
}

export function TrendUpIcon() {
  return (
    <Icon>
      <path d="m5.5 14.2 4-4 3 3L18.5 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function TrendDownIcon() {
  return (
    <Icon>
      <path d="m5.5 9.8 4 4 3-3 6-6.2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  );
}

export function DashIcon() {
  return (
    <Icon>
      <path d="M6 12h12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </Icon>
  );
}

export function CheckCircleIcon() {
  return (
    <Icon>
      <path d="M12 4.5a7.5 7.5 0 1 0 7.5 7.5A7.5 7.5 0 0 0 12 4.5Zm-1 10.4-2.3-2.3 1.1-1.1 1.2 1.2 3.4-3.4 1.1 1.1Z" fill="currentColor" />
    </Icon>
  );
}

export function PlusIcon() {
  return (
    <Icon>
      <path d="M12 5.5v13M5.5 12h13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </Icon>
  );
}

export function AdjustStockIcon() {
  return (
    <Icon>
      <path d="M12 5.4a6.6 6.6 0 1 0 6.6 6.6A6.6 6.6 0 0 0 12 5.4Zm0 3.1 2.8 2.8H13v3h-2v-3H9.2Z" fill="currentColor" />
    </Icon>
  );
}

export function TransferIcon() {
  return (
    <Icon>
      <path d="M6 8.2h8.6l-1.8-1.8 1.2-1.2 3.8 3.8-3.8 3.8-1.2-1.2 1.8-1.8H6ZM18 15.8H9.4l1.8 1.8-1.2 1.2-3.8-3.8 3.8-3.8 1.2 1.2-1.8 1.8H18Z" fill="currentColor" />
    </Icon>
  );
}

export function EditIcon() {
  return (
    <Icon>
      <path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m13.5 6.5 3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

export function TrashIcon() {
  return (
    <Icon>
      <path
        d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-.9 13a2 2 0 0 1-2 1.9H7.9a2 2 0 0 1-2-1.9L5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

export function MailOutlineIcon() {
  return (
    <Icon>
      <path d="M4.5 6.5h15A1.5 1.5 0 0 1 21 8v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16V8a1.5 1.5 0 0 1 1.5-1.5Zm0 1.6v.3l7.5 5 7.5-5v-.3h-15Zm15 7.8V10l-6.8 4.5a1.3 1.3 0 0 1-1.4 0L4.5 10v5.9h15Z" fill="currentColor" />
    </Icon>
  );
}

export function PhoneOutlineIcon() {
  return (
    <Icon>
      <path d="M7.4 4.7h2.8l1.5 4-1.8 1.5a11.8 11.8 0 0 0 3.9 3.9l1.5-1.8 4 1.5v2.8a1.3 1.3 0 0 1-1.4 1.3C10.8 18 6 13.2 5.1 6.1A1.3 1.3 0 0 1 6.4 4.7Z" fill="currentColor" />
    </Icon>
  );
}

export function UserOutlineIcon() {
  return (
    <Icon>
      <path d="M12 11.3a3.6 3.6 0 1 0-3.6-3.6 3.6 3.6 0 0 0 3.6 3.6Zm-6.2 7.2a6.2 6.2 0 0 1 12.4 0v.8H5.8Z" fill="currentColor" />
    </Icon>
  );
}

export function BuildingOutlineIcon() {
  return (
    <Icon>
      <path d="M7 4.8h10A1.8 1.8 0 0 1 18.8 6.6v12.6H5.2V6.6A1.8 1.8 0 0 1 7 4.8Zm1.1 2.1v2.1h2.1V6.9Zm4 0v2.1h2.1V6.9Zm-4 3.6v2.1h2.1v-2.1Zm4 0v2.1h2.1v-2.1Zm-4 3.6v2.1h2.1v-2.1Zm4 0v2.1h2.1v-2.1Z" fill="currentColor" />
    </Icon>
  );
}

export function PinOutlineIcon() {
  return (
    <Icon>
      <path d="M12 4.6a4.5 4.5 0 0 0-4.5 4.5c0 3.5 4.5 8.4 4.5 8.4s4.5-4.9 4.5-8.4A4.5 4.5 0 0 0 12 4.6Zm0 6.2a1.7 1.7 0 1 1 1.7-1.7 1.7 1.7 0 0 1-1.7 1.7Z" fill="currentColor" />
    </Icon>
  );
}
