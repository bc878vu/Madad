import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'MADAD — Help begins with one message', description: 'A global community where people can share a need and others can offer help.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
