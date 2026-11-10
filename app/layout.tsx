import { Cormorant_Garamond, Manrope } from 'next/font/google';
import Metrika from './metrika';
import './globals.css';

const heading = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'], variable: '--font-heading', weight: '600', display: 'swap',
});
const body = Manrope({
  subsets: ['latin', 'cyrillic'], variable: '--font-body', display: 'swap',
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body className={heading.variable + ' ' + body.variable}>{children}<Metrika /></body></html>;
}
