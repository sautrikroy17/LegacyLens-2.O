import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'LegacyLens | Natural Language Database Interface',
  description: 'Talk to your database like a human assistant. Convert natural language to SQL/MongoDB queries instantly.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${space.variable} ${outfit.variable}`}>
        {children}
      </body>
    </html>
  );
}
