import Image from 'next/image';
import Link from 'next/link';
import manuscript from './manuscript.webp';
import styles from './poem.module.css';

export const metadata = {
  title: '無舟如書｜艾蜜莉・狄金生｜StudyGo',
  description: '閱讀 StudyGo 首頁引詩的英文原文，細看艾蜜莉・狄金生在兩張紙片上留下的手稿。',
};

export default function PoemPage() {
  return <main className={`shell ${styles.reader}`}>
    <Link href="/">← 返回首頁</Link>
    <article className={styles.spread}>
      <header className={styles.heading}>
        <p className="eyebrow">艾蜜莉・狄金生 · Fr 1286</p>
        <h1>無舟如書，載我們遠航。</h1>
        <p className={styles.subtitle}><span lang="en">No Frigate Like a Book</span> · 首頁詩句意譯</p>
      </header>
      <section className={styles.verse}>
        <h2>英文原詩</h2>
        <p lang="en">
          There is no Frigate like a Book<br />
          To take us Lands away<br />
          Nor any Coursers like a Page<br />
          Of prancing Poetry –<br />
          This Traverse may the poorest take<br />
          Without oppress of Toll –<br />
          How frugal is the Chariot<br />
          That bears the Human Soul –
        </p>
      </section>
      <figure className={styles.manuscript}>
        <a href="/dickinson-manuscript.jpg" aria-label="查看手稿原圖">
          <Image src={manuscript} preload unoptimized
            alt="兩張鉛筆手稿上下並列，上半張有藍色橫線，詩行之間留有替換用字。" />
        </a>
        <figcaption>詩作手稿 · <span lang="en">Amherst College Archives &amp; Special Collections</span></figcaption>
      </figure>
      <footer className={styles.source}>
        <p>在第二行的「us」旁，狄金生也寫下了「one」。這一趟書上的航程，可以是我們同行，也可以是一人獨遊。</p>
        <a href="https://www.emilydickinsonmuseum.org/roomitem/no-frigate-like-a-book/">閱讀狄金生博物館的手稿解說 ↗</a>
      </footer>
    </article>
  </main>;
}
