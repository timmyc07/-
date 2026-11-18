import Link from 'next/link';

export default function NotFound() {
  return <main className="shell admin">
    <h1>找不到這個頁面</h1>
    <p>請檢查網址，或從首頁重新查詢館舍。</p>
    <div className="hero-actions">
      <Link className="primary-action" href="/search">查詢自修空間</Link>
      <Link href="/">返回首頁</Link>
    </div>
  </main>;
}
