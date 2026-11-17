import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { ApolloProvider } from "@/lib/apollo/ApolloProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { defaultMetadata } from "./metadata";
import { StripeFab } from "@/components/stripe/StripeFab";
import { FabStack } from "@/components/layouts/FabStack";
import { NONCE_HEADER } from "@/lib/security/csp";

export const metadata: Metadata = {
  ...defaultMetadata,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // proxy.ts sets a nonce per request (#479). Reading it makes every page
  // dynamic, which nonces require.
  const nonce = (await headers()).get(NONCE_HEADER) ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem 
          disableTransitionOnChange
          nonce={nonce}
        >
          <ApolloProvider>
            <AuthProvider>
              <GoogleAnalytics nonce={nonce} />
              {children}
              <Toaster />
              <SonnerToaster />
              <FabStack>
                {/* <GogginsFab /> */}
                <StripeFab />
              </FabStack>
            </AuthProvider>
          </ApolloProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
