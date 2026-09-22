/**
 * Formats a number to Indian Rupee currency string, e.g. 210000 -> ₹2,10,000
 */
export function formatIndianCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === "") return "₹0";
  const num = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.-]+/g, "")) : amount;
  if (isNaN(num)) return "₹0";

  // Check sign
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Split integer and decimal parts
  const parts = absNum.toFixed(2).split(".");
  let intPart = parts[0];
  const decPart = parts[1];

  // Indian numbering system formatting:
  // Last 3 digits separated, then every 2 digits
  if (intPart.length > 3) {
    const lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  }

  const formattedDecimal = decPart !== "00" ? `.${decPart}` : "";
  return `${isNegative ? "-" : ""}₹${intPart}${formattedDecimal}`;
}

/**
 * Strips currency symbols and formatting, returning a clean numeric value
 */
export function parseCurrencyInput(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[^0-9.-]+/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a date into DD/MM/YYYY
 */
export function formatDateDMY(dateInput?: string | Date | null): string {
  if (!dateInput) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }

  if (typeof dateInput === "string" && dateInput.includes("/")) {
    return dateInput;
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Converts a numeric amount to Indian Rupee words (Crores, Lakhs, Thousands, Hundreds, Rupees, Paise)
 * e.g. 210000 -> "RUPEES TWO LAKH TEN THOUSAND ONLY"
 */
export function convertNumberToWords(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === "") return "ZERO RUPEES ONLY";
  const num = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.-]+/g, "")) : amount;
  if (isNaN(num) || num === 0) return "ZERO RUPEES ONLY";

  const a = [
    "", "ONE ", "TWO ", "THREE ", "FOUR ", "FIVE ", "SIX ", "SEVEN ", "EIGHT ", "NINE ",
    "TEN ", "ELEVEN ", "TWELVE ", "THIRTEEN ", "FOURTEEN ", "FIFTEEN ", "SIXTEEN ", "SEVENTEEN ", "EIGHTEEN ", "NINETEEN "
  ];
  const b = ["", "", "TWENTY ", "THIRTY ", "FORTY ", "FIFTY ", "SIXTY ", "SEVENTY ", "EIGHTY ", "NINETY "];

  const intPart = Math.floor(Math.abs(num));
  const decPart = Math.round((Math.abs(num) - intPart) * 100);

  function convertChunk(nVal: number): string {
    if (nVal === 0) return "";
    let str = "";
    if (nVal > 99) {
      str += a[Math.floor(nVal / 100)] + "HUNDRED ";
      nVal %= 100;
    }
    if (nVal > 0) {
      if (str !== "") str += "AND ";
      if (nVal < 20) {
        str += a[nVal];
      } else {
        str += b[Math.floor(nVal / 10)] + a[nVal % 10];
      }
    }
    return str;
  }

  function numberToIndianWords(n: number): string {
    if (n === 0) return "";
    let s = "";
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const hundred = n;

    if (crore > 0) s += numberToIndianWords(crore) + "CRORE ";
    if (lakh > 0) s += convertChunk(lakh) + "LAKH ";
    if (thousand > 0) s += convertChunk(thousand) + "THOUSAND ";
    if (hundred > 0) s += convertChunk(hundred);

    return s;
  }

  let words = "RUPEES " + numberToIndianWords(intPart).trim();
  if (decPart > 0) {
    words += " AND " + convertChunk(decPart).trim() + "PAISE";
  }
  return words.trim() + " ONLY";
}

