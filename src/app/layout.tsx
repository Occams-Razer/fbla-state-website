import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { MuiProvider } from "@/components/layout/MuiProvider";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Runs synchronously before first paint to prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('foundry-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <AppRouterCacheProvider>
          <MuiProvider>{children}</MuiProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
