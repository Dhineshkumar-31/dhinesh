/**
 * Formats a number into Indian Rupee currency format (e.g. ₹1,25,500.00 or ₹1,25,500)
 */
export function formatINR(amount: number | null | undefined, showDecimals = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showDecimals ? "₹0.00" : "₹0";
  }

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  return formatter.format(amount);
}

/**
 * Format a date in Indian standard style: e.g. 04 Oct 2026
 */
export function formatDate(date: string | Date | null | undefined, locale = "en"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat(locale === "ta" ? "ta-IN" : "en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Format a date for HTML input type="date" (YYYY-MM-DD)
 */
export function toInputDateFormat(date: string | Date | null | undefined): string {
  if (!date) return new Date().toISOString().split("T")[0];
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  return d.toISOString().split("T")[0];
}
