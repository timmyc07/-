import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SiteHeader from './site-header.tsx';
import './style.css';

export const metadata: Metadata = {
  title: 'StudyGo｜全臺公立圖書館自修查詢',
  description: '查詢全臺公立圖書館自修空間的開放時間、入場資格與設備。',
};

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="zh-Hant" data-scroll-behavior="smooth" suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: `try {
        const theme = localStorage.getItem('studygo-theme');
        if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
      } catch {}` }} />
    </head>
    <body><SiteHeader />{children}</body>
  </html>;
}
