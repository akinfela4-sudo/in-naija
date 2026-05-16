import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "In-Naija | Nigeria's First AI-Automated News Platform",
  description: "Breaking Nigerian news, politics, and election intelligence powered by AI. Experience news in Standard English and Pidgin.",
  keywords: ["Nigeria News", "Nigerian Politics", "Osun Decides", "AI News", "Pidgin News"],
  authors: [{ name: "In-Naija Media" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
