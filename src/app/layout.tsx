import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foundry",
  description: "Middleton High School Lost and Found System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
