import NextTopLoader from "nextjs-toploader";

import "@/css/satoshi.css";
import "@/app/globals.css";

import { auth } from "@/auth";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/toaster";
import NextAuthProvider from "@/providers/NextAuthProvider";

export const metadata = {
  title: "City of London College - Admin Portal",
  description: "Admin Portal for City of London College",
};

export default async function RootLayout({ children }) {
  const session = await auth();
  const sessionKey = new Date().valueOf();

  return (
    <NextAuthProvider session={session} sessionKey={sessionKey}>
      <html lang="en">
        <body suppressHydrationWarning={true}>
          <QueryProvider>
            <NextTopLoader />
            {children}
            <Toaster />
          </QueryProvider>
        </body>
      </html>
    </NextAuthProvider>
  );
}