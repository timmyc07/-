import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './style.css';

export const metadata: Metadata = {
  title: 'StudyGo｜臺中公立圖書館自修查詢',
  description: '查詢臺中公立圖書館自修空間的開放時間、入場資格與設備。',
};

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
