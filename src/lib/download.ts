/**
 * Reliable same-tab PDF presentation and client-side downloader.
 */

/**
 * Present the PDF directly in the existing browser tab without forcing a file download.
 */
export function openPdfSameTab(endpointUrl: string): void {
  window.location.href = endpointUrl;
}

/**
 * Download PDF file to client storage when explicitly requested.
 */
export async function downloadPdfBlob(
  endpointUrl: string,
  filename: string
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const downloadUrl = endpointUrl.includes("?")
      ? `${endpointUrl}&download=true`
      : `${endpointUrl}?download=true`;

    const res = await fetch(downloadUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned error ${res.status}: Failed to generate PDF`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/pdf")) {
      // If server returned HTML (e.g. redirected fallback on VPS without GUI Chromium),
      // smoothly open the print preview page so native browser print triggers without throwing an error
      window.location.href = endpointUrl;
      return;
    }

    const blob = await res.blob();
    if (!blob || blob.size === 0) {
      throw new Error("Received empty PDF file from server");
    }

    const pdfBlob = new Blob([blob], { type: "application/pdf" });
    const blobUrl = window.URL.createObjectURL(pdfBlob);

    try {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
      link.rel = "noopener noreferrer";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (clickErr) {
      // Fallback: present directly in existing window
      window.location.href = blobUrl;
    }

    // Give browser time to process before revoking
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 15000);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("PDF generation timed out. Please try again or use the Print button.");
    }
    throw err;
  }
}
