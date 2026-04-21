import type { Metadata } from "next";
import "./globals.css";
import { AppFooter } from "@/components/app-footer";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Rift Clues",
  description: "A League of Legends inspired word-association party game.",
  other: {
    "google-adsense-account": "ca-pub-4018439518512789",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          {children}
          <AppFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
