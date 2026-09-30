import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui";
import "./globals.css";
import localFont from "next/font/local";

const metropolis = localFont({
  src: [
    { path: "./fonts/Metropolis-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Metropolis-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Metropolis-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Metropolis-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-metropolis",
  display: "swap",
});

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
    <html lang="en" className={metropolis.variable} suppressHydrationWarning>
      <head>
        {/* Runs synchronously before first paint to prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('foundry-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
