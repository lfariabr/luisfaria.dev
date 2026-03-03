import type { Metadata } from "next";
import "./globals.css";
import { ApolloProvider } from "@/lib/apollo/ApolloProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { defaultMetadata } from "./metadata";
import { GogginsFab } from "@/components/goggins/GogginsFab";
import { ApodFab } from "@/components/apod/ApodFab";
import { StripeFab } from "@/components/stripe/StripeFab";

export const metadata: Metadata = {
  ...defaultMetadata,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem 
          disableTransitionOnChange
        >
          <ApolloProvider>
            <AuthProvider>
              <GoogleAnalytics />
              {children}
              <Toaster />
              {/* <GogginsFab /> */}
              <StripeFab />
              <ApodFab />
            </AuthProvider>
          </ApolloProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
