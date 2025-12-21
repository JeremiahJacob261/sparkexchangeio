import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spark Exchange - Decentralized Crypto Exchange",
  description: "Secure, fast, cheap, anonymous swaps. No account needed. Exchange between 900+ cryptocurrencies with the best rates.",
  keywords: ["crypto", "exchange", "decentralized", "swap", "bitcoin", "ethereum", "trading"],
  icons: {
    icon: "/favicon.jpg",
  },
  openGraph: {
    title: "Spark Exchange - Decentralized Crypto Exchange",
    description: "Secure, fast, cheap, anonymous swaps. No account needed.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
