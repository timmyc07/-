import Image from 'next/image';
import Link from 'next/link';
import { House, Search } from './action-icons.ts';

export default function SiteHeader() {
  return <header id="top" className="header">
    <div className="shell bar">
      <Link className="brand" href="/" prefetch aria-label="StudyGo 首頁">
        <Image className="brand-mark" src="/studygo-logo.webp" alt="" width={40} height={40} unoptimized />
        StudyGo
      </Link>
      <nav className="site-nav" aria-label="主要導覽">
        <a href="/#top"><House size={16} />首頁大廳</a>
        <Link className="nav-search" href="/search" prefetch><Search size={16} />查詢空間</Link>
      </nav>
    </div>
  </header>;
}
