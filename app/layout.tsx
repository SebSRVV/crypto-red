import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
<<<<<<< HEAD
import Chatbot from './components/Chatbot';
=======
>>>>>>> 79896b1e8f8a222551fde3cdf0fa8920429190de

// Carga de tipografías con variables CSS
const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

// Metadatos del sitio
export const metadata: Metadata = {
  title: 'CryptoRed',
  description: 'Impulsando tus decisiones con inteligencia artificial en criptomonedas emergentes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
