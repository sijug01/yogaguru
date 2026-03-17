import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yoga RAG Assistant',
  description: 'AI-powered yoga guide with voice support',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
