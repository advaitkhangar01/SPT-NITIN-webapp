/**
 * Reliable client-side PDF downloader across desktop & mobile browsers.
 */
export async function downloadPdfBlob(
  endpointUrl: string,
  filename: string
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(endpointUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned error ${res.status}: Failed to generate PDF`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/pdf")) {
      // If server returned HTML (e.g. redirected fallback)
      throw new Error("Invalid response format received from PDF service");
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
      // Fallback: open directly in new tab if download trigger blocked
      window.open(blobUrl, "_blank");
    }

    // Give browser time to start the download before revoking
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 4000);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("PDF generation timed out. Please try again or use the Print button.");
    }
    throw err;
  }
}
