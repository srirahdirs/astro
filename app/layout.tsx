import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';

const fontHeading = Cormorant_Garamond({ weight: ['500', '600', '700'], subsets: ['latin'], variable: '--font-heading', display: 'swap' });
const fontBody = DM_Sans({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: 'Wedding Profile Matcher',
  description: 'Track profiles and reminders for wedding matching',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-x-hidden min-h-full">
      <body className={"min-h-screen min-h-full antialiased overflow-x-hidden font-body " + fontHeading.variable + " " + fontBody.variable}>{children}</body>
    </html>
  );
}
