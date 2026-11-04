import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-main", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "RT SMART", template: "%s | RT SMART" },
  description: "Portal layanan RT untuk data kependudukan, kas, surat menyurat, pilah botol, QR, dan voucher warga.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className={inter.variable}>{children}</body></html>;
}
