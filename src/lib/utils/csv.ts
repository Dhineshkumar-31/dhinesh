import { formatDate } from "./currency";

export interface CSVExpenseItem {
  expenseDate: string | Date;
  itemDescription: string;
  expenseType: string;
  category: string;
  stage: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  supplierName?: string | null;
  workerName?: string | null;
  paymentStatus: string;
}

export function exportExpensesToCSV(expenses: CSVExpenseItem[], filename = "buildledger_expenses.csv") {
  const headers = [
    "Date",
    "Description",
    "Type",
    "Category",
    "Stage",
    "Quantity",
    "Unit",
    "Unit Price (INR)",
    "Total (INR)",
    "Paid (INR)",
    "Balance (INR)",
    "Supplier / Worker",
    "Payment Status",
  ];

  const rows = expenses.map((e) => [
    `"${formatDate(e.expenseDate)}"`,
    `"${(e.itemDescription || "").replace(/"/g, '""')}"`,
    `"${e.expenseType}"`,
    `"${(e.category || "").replace(/"/g, '""')}"`,
    `"${(e.stage || "").replace(/"/g, '""')}"`,
    e.quantity,
    `"${e.unit}"`,
    e.unitPrice,
    e.totalAmount,
    e.paidAmount,
    e.balanceAmount,
    `"${(e.supplierName || e.workerName || "").replace(/"/g, '""')}"`,
    `"${e.paymentStatus}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
