import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "החתונה של שירה וגדליה",
  description: "הזמנה לחתונה של שירה וגדליה - 3 בספטמבר 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Cormorant Garamond - elegant serif for titles */}
        {/* Playfair Display - refined serif */}
        {/* Noto Serif Hebrew - Hebrew serif */}
        {/* Assistant - clean Hebrew sans-serif for body */}
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Noto+Serif+Hebrew:wght@300;400;500&family=Assistant:wght@300;400;500;600&family=Great+Vibes&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}