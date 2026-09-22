import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Shashikala Power Tech — Quotation & Invoice Maker",
  description: "Solar & Energy Solutions Quotation and Invoice Generation Utility",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased overflow-x-hidden w-full max-w-full">
        <Navbar />
        <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
      </body>
    </html>
  );
}
