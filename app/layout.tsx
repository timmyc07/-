import type { Metadata } from 'next';
import { Noto_Sans_TC, Noto_Serif_TC } from 'next/font/google';
import type { ReactNode } from 'react';
import { ScrollProgress } from './site-motion.tsx';
import SiteHeader from './site-header.tsx';
import './style.css';

const sans = Noto_Sans_TC({ variable: '--font-sans', display: 'swap', preload: false });
const serif = Noto_Serif_TC({ variable: '--font-serif', display: 'swap', preload: false });

export const metadata: Metadata = {
  title: 'StudyGo｜全臺公立圖書館自修查詢',
  description: '查詢全臺公立圖書館自修空間的開放時間、入場資格與設備。',
};

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="zh-Hant" className={`${sans.variable} ${serif.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: `try {
        const theme = localStorage.getItem('studygo-theme');
        if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
      } catch {}` }} />
    </head>
    <body><ScrollProgress /><SiteHeader />{children}</body>
  </html>;
}
