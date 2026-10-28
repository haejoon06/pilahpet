import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const body = Manrope({ variable: "--font-body", subsets: ["latin"] });
const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "SiPilah PET", template: "%s | SiPilah PET" },
  description: "Pengelolaan botol minuman PET berbasis alat press manual dan sistem informasi terintegrasi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className={`${body.variable} ${display.variable}`}>{children}</body></html>;
}
