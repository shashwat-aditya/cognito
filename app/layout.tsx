import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { dark } from "@clerk/themes";
import { DialogProvider } from "@/contexts/DialogContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cognito",
  description: "Build and deploy AI agents with a powerful visual interface.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
    appearance={{
      theme: dark
    }}
    >
      <html lang="en" className="dark">
        <head>
          <link href='https://fonts.googleapis.com/css?family=Poppins' rel='stylesheet'></link>
        </head>
        <body
          suppressHydrationWarning
          className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-indigo-500/30`}
        >
          <DialogProvider>
            {children}
          </DialogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
