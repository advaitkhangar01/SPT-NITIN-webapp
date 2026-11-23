"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Printer, Download, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { downloadPdfBlob } from "@/lib/download";

interface PrintToolbarProps {
  documentTitle: string;
  backHref: string;
  pdfDownloadHref: string;
}

export default function PrintToolbar({
  documentTitle,
  backHref,
  pdfDownloadHref,
}: PrintToolbarProps) {
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const filename = `${documentTitle.replace(/[^\w\s-]/gi, "").replace(/\s+/g, "_")}.pdf`;
      await downloadPdfBlob(pdfDownloadHref, filename);
    } catch (err: any) {
      alert(err.message || "PDF download failed. You can use 'Print / Save as PDF' as an instant alternative.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="no-print w-full bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 sticky top-0 z-50 shadow-md border-b border-slate-700/60 transition-all">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back & Document Title */}
        <div className="flex items-center space-x-3">
          <Link
            href={backHref}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition border border-slate-700 shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
          <div className="hidden sm:block">
            <span className="text-xs font-bold text-slate-300 tracking-wide">
              {documentTitle}
            </span>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center space-x-2.5">
          {/* Instant Client-Side Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0F4C81] hover:bg-[#16568F] text-white rounded-lg text-xs font-bold transition shadow-sm active:scale-95"
            title="Instant print or Save to PDF via Browser"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>

          {/* Direct Server PDF Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition shadow-sm active:scale-95 disabled:opacity-50"
            title="Download PDF directly to file system"
          >
            {downloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Direct Download</span>
                <span className="xs:hidden">Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
