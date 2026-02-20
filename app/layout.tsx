import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pricing Parity Calculator",
  description: "Calculate localized prices from a base USD amount."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
