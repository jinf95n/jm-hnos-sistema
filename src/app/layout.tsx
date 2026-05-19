import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <NextTopLoader color="#f3b229" showSpinner={false} shadow="0 0 10px #f3b229,0 0 5px #f3b229" />
        <Navbar />
        {children}
      </body>
    </html>
  );
}