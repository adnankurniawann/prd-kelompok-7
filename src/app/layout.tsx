import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

// Setup Font Poppins agar tampilannya modern seperti prototipe
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Gacha Makan - Jatinangor",
  description: "Solusi decision fatigue buat mahasiswa laper",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        {/* Link Font Awesome supaya icon <i className="fa-solid ..."> muncul */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
        />
      </head>
      <body className={`${poppins.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  );
}