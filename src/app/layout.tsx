import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "AIditorial - WebLLM-powered local editorial assistant",
  description:
    "Edit essays and personal writing with a WebLLM model running in your browser. Runs and extracted document text remain in local browser storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="overflow-x-clip scroll-smooth bg-background [color-scheme:dark]"
    >
      <body className="min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_10%_-10%,oklch(0.32_0.1_300/22%),transparent_32rem),var(--background)] font-sans text-foreground antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-11rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
