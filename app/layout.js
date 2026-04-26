import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Chatbot from "@/components/chatbot";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FinSight",
  description: "One stop Finance Platform",
};

import { TooltipProvider } from "@/components/ui/tooltip";

export default async function RootLayout({ children }) {

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/logo-sm.png" sizes="any" />
        </head>
        <body className={`${inter.className}`}>
          <TooltipProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <ToastContainer position="top-left" autoClose={3000} newestOnTop />
            <Chatbot />
            <Footer />
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
