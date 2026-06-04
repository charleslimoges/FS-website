import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatBot from "@/components/ui/ChatBot";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YourKeyMTL — Licensed Leasing Agent in Montreal",
  description:
    "Find your next home in Montreal with a dedicated leasing agent. Browse apartments across Plateau, Downtown, Rosemont, Hochelaga and more.",
  keywords: "Montreal apartments, leasing agent, condos for rent, Plateau, Downtown Montreal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-outfit antialiased bg-white text-brand-navy">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ChatBot />
      </body>
    </html>
  );
}
