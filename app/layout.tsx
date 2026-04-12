import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XIAOMA AI",
  description: "Minimal premium AI workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased selection:bg-zinc-900 selection:text-zinc-50">
        {children}
      </body>
    </html>
  );
}
