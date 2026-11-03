import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "../../public/assets/inter-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlasmaX | Live TV and Crypto Exchange",
  description: "Secure, fast, cheap, anonymous swaps. No account needed. Exchange between 900+ cryptocurrencies with the best rates.",
  keywords: ["crypto", "exchange", "decentralized", "swap", "bitcoin", "ethereum", "trading"],
  icons: {
    icon: "/assets/plasmax-mark.svg",
  },
  openGraph: {
    title: "PlasmaX | Live TV and Crypto Exchange",
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
