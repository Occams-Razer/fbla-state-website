import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { MuiProvider } from "@/components/layout/MuiProvider";
import "./globals.css";
import localFont from "next/font/local";

const metropolis = localFont({
  src: [
    { path: "../../public/fonts/Metropolis-Thin.ttf", weight: "100", style: "normal" },
    { path: "../../public/fonts/Metropolis-ThinItalic.ttf", weight: "100", style: "italic" },
    { path: "../../public/fonts/Metropolis-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../../public/fonts/Metropolis-ExtraLightItalic.ttf", weight: "200", style: "italic" },
    { path: "../../public/fonts/Metropolis-Light.ttf", weight: "300", style: "normal" },
    { path: "../../public/fonts/Metropolis-LightItalic.ttf", weight: "300", style: "italic" },
    { path: "../../public/fonts/Metropolis-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/Metropolis-RegularItalic.ttf", weight: "400", style: "italic" },
    { path: "../../public/fonts/Metropolis-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/Metropolis-MediumItalic.ttf", weight: "500", style: "italic" },
    { path: "../../public/fonts/Metropolis-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/Metropolis-SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "../../public/fonts/Metropolis-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/Metropolis-BoldItalic.ttf", weight: "700", style: "italic" },
    { path: "../../public/fonts/Metropolis-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../../public/fonts/Metropolis-ExtraBoldItalic.ttf", weight: "800", style: "italic" },
    { path: "../../public/fonts/Metropolis-Black.ttf", weight: "900", style: "normal" },
    { path: "../../public/fonts/Metropolis-BlackItalic.ttf", weight: "900", style: "italic" },
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
        <AppRouterCacheProvider>
          <MuiProvider>{children}</MuiProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
