import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "@/lib/utils/currency";

export interface PDFReportData {
  title: string;
  reportType: string;
  dateRange: string;
  house: {
    name: string;
    ownerName: string;
    location: string;
    totalBudget: number;
  };
  summary: {
    totalSpent: number;
    remainingBudget?: number;
    materialExpense?: number;
    labourExpense?: number;
    otherExpense?: number;
    transactionCount: number;
  };
  categoryBreakdown?: Array<{ name: string; amount: number }>;
  stageBreakdown?: Array<{ name: string; amount: number }>;
  expenses: Array<{
    expenseDate: string | Date;
    itemDescription: string;
    category: string;
    stage: string;
    expenseType: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    supplierName?: string | null;
    workerName?: string | null;
    paymentStatus: string;
    paymentMethod: string;
  }>;
}

function formatPDFAmount(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "Rs. 0";
  return `Rs. ${Math.round(val).toLocaleString("en-IN")}`;
}

function cleanPDFText(text?: string | null): string {
  if (!text) return "-";
  // Replace Rupee symbol if present, remove Tamil script block, clean empty parenthesis and normalize spaces
  let cleaned = text
    .replace(/₹/g, "Rs. ")
    .replace(/[\u0B80-\u0BFF]/g, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    cleaned = text.replace(/[^\x20-\x7E]/g, "").trim();
  }
  return cleaned || "-";
}

export function generateExpensePDF(data: PDFReportData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Theme Colors
  const primaryColor = [26, 86, 219]; // Royal Blue
  const secondaryColor = [31, 41, 55]; // Dark Charcoal
  const lightBg = [243, 244, 246]; // Cool Grey

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 28, "F");

  // Title & Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("BuildLedger", 14, 12);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Build Smarter. Track Every Expense.", 14, 18);
  doc.text("House Construction Expense & Budget Manager", 14, 23);

  // Report Date Info (Right side)
  doc.setFontSize(9);
  doc.text(`Generated: ${formatDate(new Date())}`, pageWidth - 14, 12, { align: "right" });
  doc.text(`Report Type: ${cleanPDFText(data.reportType)}`, pageWidth - 14, 18, { align: "right" });
  doc.text(`Period: ${cleanPDFText(data.dateRange)}`, pageWidth - 14, 23, { align: "right" });

  let y = 35;

  // 2. Project & Owner Information Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, "F");

  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("House Project:", 18, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(`${cleanPDFText(data.house.name)}`, 48, y + 7);

  doc.setFont("helvetica", "bold");
  doc.text("Owner Name:", 18, y + 14);
  doc.setFont("helvetica", "normal");
  doc.text(`${cleanPDFText(data.house.ownerName)}`, 48, y + 14);

  doc.setFont("helvetica", "bold");
  doc.text("Location:", pageWidth / 2 + 10, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(`${cleanPDFText(data.house.location)}`, pageWidth / 2 + 30, y + 7);

  doc.setFont("helvetica", "bold");
  doc.text("Estimated Budget:", pageWidth / 2 + 10, y + 14);
  doc.setFont("helvetica", "normal");
  doc.text(`${formatPDFAmount(data.house.totalBudget)}`, pageWidth / 2 + 45, y + 14);

  y += 28;

  // 3. Financial Summary Cards
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Financial Summary", 14, y);
  y += 4;

  const cardWidth = (pageWidth - 28 - 9) / 4;
  const cards = [
    { label: "Total Spent", value: formatPDFAmount(data.summary.totalSpent) },
    {
      label: "Remaining Budget",
      value: formatPDFAmount(data.summary.remainingBudget ?? Math.max(0, data.house.totalBudget - data.summary.totalSpent)),
    },
    { label: "Material Spent", value: formatPDFAmount(data.summary.materialExpense ?? 0) },
    { label: "Labour Spent", value: formatPDFAmount(data.summary.labourExpense ?? 0) },
  ];

  cards.forEach((card, idx) => {
    const cardX = 14 + idx * (cardWidth + 3);
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(cardX, y, cardWidth, 16, 2, 2, "FD");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text(card.label, cardX + cardWidth / 2, y + 5, { align: "center" });

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(card.value, cardX + cardWidth / 2, y + 11.5, { align: "center" });
  });

  y += 22;

  // 4. Itemized Expense Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Transaction Details (${data.expenses.length} Records)`, 14, y);
  y += 3;

  const tableRows = data.expenses.map((exp, index) => [
    (index + 1).toString(),
    formatDate(exp.expenseDate),
    cleanPDFText(exp.itemDescription),
    cleanPDFText(exp.category),
    cleanPDFText(exp.stage),
    cleanPDFText(exp.supplierName || exp.workerName || "-"),
    formatPDFAmount(exp.totalAmount),
    formatPDFAmount(exp.paidAmount),
    formatPDFAmount(exp.balanceAmount),
    cleanPDFText(exp.paymentStatus),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "Date", "Description", "Category", "Stage", "Vendor / Worker", "Total", "Paid", "Balance", "Status"]],
    body: tableRows,
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      overflow: "linebreak",
      font: "helvetica",
    },
    headStyles: {
      fillColor: primaryColor as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 16, halign: "center" },
      2: { cellWidth: 34, halign: "left" },
      3: { cellWidth: 20, halign: "left" },
      4: { cellWidth: 22, halign: "left" },
      5: { cellWidth: 18, halign: "left" },
      6: { cellWidth: 18, halign: "right" },
      7: { cellWidth: 16, halign: "right" },
      8: { cellWidth: 16, halign: "right" },
      9: { cellWidth: 14, halign: "center" },
    },
    margin: { left: 14, right: 14 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didDrawPage: (hookData: any) => {
      // Footer on every page
      const str = `Page ${hookData.pageNumber} of ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      doc.text(
        "BuildLedger — Certified Construction Financial Statement",
        14,
        doc.internal.pageSize.getHeight() - 10
      );
      doc.text(str, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: "right" });
    },
  });

  return doc;
}
