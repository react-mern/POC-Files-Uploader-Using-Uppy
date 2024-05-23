import type { Metadata } from "next";
import { Inter,Lora } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const lora = Lora({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "POC-UPPY",
  description: "Files Uploading Liberary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        </body>
    </html>
  );
}
