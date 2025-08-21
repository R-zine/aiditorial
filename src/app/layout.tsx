import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import styles from "./page.module.css";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIditorial - WebLLM-powered local editorial assistant",
  description:
    "AIditorial is a web-app which runs entirely locally on your computer, utilizing WebLLM to run locals on your hardware. Whatever you write on this page never leaves your computer, unless, of course, you want to use the built-in Google Docs integration. Once the model of your choosing loads, you are free to even turn off your internet to verify.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header className="fixed z-11000 flex top-1.5 w-full align-center justify-center">
          <Navbar />
        </header>
        <main className={styles.main}>{children}</main>
        <footer className={styles.footer}>
          <Footer />
        </footer>
      </body>
    </html>
  );
}
