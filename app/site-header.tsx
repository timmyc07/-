import Image from 'next/image';
import Link from 'next/link';
import { House, Search } from './action-icons.ts';

export default function SiteHeader() {
  return <header id="top" className="header">
    <div className="shell bar">
      <Link className="brand" href="/" aria-label="StudyGo 首頁">
        <Image className="brand-mark" src="/studygo-logo.webp" alt="" width={40} height={40} unoptimized />
        StudyGo
      </Link>
      <nav className="site-nav" aria-label="主要導覽">
        <Link href="/#top"><House size={16} />首頁大廳</Link>
        <Link className="nav-search" href="/search"><Search size={16} />查詢空間</Link>
      </nav>
    </div>
  </header>;
}
