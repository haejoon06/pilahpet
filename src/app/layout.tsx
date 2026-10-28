import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-main", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "SiPilah PET", template: "%s | SiPilah PET" },
  description: "Pengelolaan botol minuman PET berbasis alat press manual dan sistem informasi terintegrasi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className={inter.variable}>{children}</body></html>;
}
