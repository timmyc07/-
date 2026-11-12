import Link from 'next/link';
import { taichungSnapshot } from '../lib/mongodb.ts';
import { clock, evaluate, facilities, kindLabels, minutes, timePattern, validDate, weekdays } from '../lib/study.ts';
import type { Area, Facility, Library, Query } from '../lib/study.ts';

type Params = Record<string, string | string[] | undefined>;
const facilityKeys = Object.keys(facilities) as Facility[];
const statuses = { yes: '符合條件', unknown: '待確認', no: '不符合' } as const;
const pageSize = 15;

export default async function Home({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const get = (key: string) => typeof params[key] === 'string' ? params[key] : undefined;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', dateStyle: 'short' }).format(new Date());
  const date = get('date') ?? today;
  const start = get('start') ?? '14:00';
  const duration = Number(get('duration') ?? 120);
  const requestedKind = get('kind');
  const kind = requestedKind && Object.hasOwn(kindLabels, requestedKind) ? requestedKind as Area['kind'] : '';
  const equipment = facilityKeys.filter((key) => get(key) === 'on');
  const district = get('district') ?? '';
  const keyword = (get('q') ?? '').trim().slice(0, 100);
  const original = get('original') ?? '';
  const view = get('view');
  const statusFilter = view && Object.hasOwn(statuses, view) ? view as keyof typeof statuses : '';
  const page = Math.max(1, Number.parseInt(get('page') ?? '1', 10) || 1);
  const searched = get('search') === '1';
  const invalid = searched && (!validDate(date) || !timePattern.test(start) ||
    !Number.isInteger(duration) || duration < 1 || minutes(start) + duration > 1440);
  const query: Query = { date, start: minutes(start), duration, kind,
    card: get('card') === 'on', registration: get('registration') === 'on', required: equipment };

  let snapshot;
  try {
    snapshot = await taichungSnapshot();
  } catch {
    return <main className="shell"><h1>StudyGo</h1><p role="alert">目前無法連線至 MongoDB。請確認本機資料庫已啟動。</p></main>;
  }
  if (!snapshot) {
    return <main className="shell"><h1>StudyGo</h1><p role="status">臺中資料尚未匯入。請先執行 <code>npm run import:taichung</code>。</p></main>;
  }

  const libraries = snapshot.libraries;
  const districts = [...new Set(libraries.map((library) => library.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
  const selected = libraries.find((library) => library.id === original);
  const normalized = (value: string) => value.normalize('NFKC').replaceAll('台', '臺');
  const candidates = libraries.filter((library) => (!district || library.district === district) &&
    (!keyword || normalized(library.name + ' ' + library.address).includes(normalized(keyword))));
  const results = searched && !invalid ? candidates.flatMap((library) => {
    const matching = kind ? library.areas.filter((area) => area.kind === kind) : library.areas;
    const areas: (Area | undefined)[] = matching.length ? matching : [undefined];
    return areas.map((area) => ({ library, area, ...evaluate(library, area, query) }));
  }) : [];
  const rank = { yes: 0, unknown: 1, no: 2 };
  results.sort((a, b) => rank[a.status] - rank[b.status]);
  const visible = results.filter((item) => !statusFilter || item.status === statusFilter);
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(totalPages, page);
  const backups = results.filter((item) => item.status === 'yes' && item.library.id !== original).slice(0, 3);
  const originalResult = selected && evaluate(selected, selected.areas.find((area) => !kind || area.kind === kind), query);
  const checked = libraries.filter((library) => library.areas.some((area) =>
    area.kind === 'study' && area.slots?.length && (area.access === 'walk-in' || area.access === 'card')));
  const featured = checked.slice(0, 4);

  function href(changes: Record<string, string>) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (typeof value === 'string') next.set(key, value);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    return '/?' + next.toString() + '#results';
  }

  return <>
    <header className="header">
      <div className="shell bar">
        <Link className="brand" href="/" aria-label="StudyGo 首頁"><span className="brand-icon" aria-hidden="true">S</span>StudyGo</Link>
        <span className="place">臺中市 · 公立圖書館自修查詢</span>
        <Link href="/admin" className="data-link">資料狀態 <span aria-hidden="true">↗</span></Link>
      </div>
    </header>
    <main className="shell">
      <section className="hero" aria-labelledby="title">
        <div>
          <p className="eyebrow">臺中市公立圖書館</p>
          <h1 id="title">找一個時段，<br />安靜讀書。</h1>
          <p className="intro">按時間、空間和設備找自修地點，出發前確認入場規則與休館公告。</p>
        </div>
        <div className="stats" aria-label="名錄統計">
          <div><strong>{districts.length}</strong><span>行政區</span></div>
          <div><strong>{libraries.length}</strong><span>名錄紀錄</span></div>
          <div><strong>{checked.length}</strong><span>已有空間時段的館</span></div>
        </div>
      </section>
      <form className="search" method="get" action="/#results">
        <div className="form-top"><h2>查詢條件</h2><Link href="/">清除條件</Link></div>
        <div className="inputs">
          <label>行政區<select name="district" defaultValue={district}><option value="">全臺中市</option>
            {districts.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>日期<input type="date" name="date" defaultValue={date} required /></label>
          <label>開始時間<input type="time" name="start" defaultValue={start} required /></label>
          <label>使用時長（分鐘）<input type="number" name="duration" min="1" max="1440" defaultValue={Number.isFinite(duration) ? duration : 120} required /></label>
          <label>空間類型<select name="kind" defaultValue={kind}><option value="">所有空間</option>
            {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>館名或地址<input type="search" name="q" maxLength={100} defaultValue={keyword} placeholder="例如 大墩分館" /></label>
        </div>
        <div className="filters">
          <fieldset><legend>需要的設備</legend><div className="checks">
            {facilityKeys.map((key) => <label key={key}><input type="checkbox" name={key} defaultChecked={equipment.includes(key)} />{facilities[key]}</label>)}
          </div></fieldset>
          <fieldset><legend>入場條件</legend><div className="checks">
            <label><input type="checkbox" name="card" defaultChecked={query.card} />有國資圖或臺中市圖個人借閱證</label>
            <label><input type="checkbox" name="registration" defaultChecked={query.registration} />可預約或現場登記</label>
          </div></fieldset>
          {selected && <input type="hidden" name="original" value={selected.id} />}
          <button type="submit" name="search" value="1">查詢空間 <span aria-hidden="true">→</span></button>
        </div>
      </form>
      <section id="results" className="results" aria-labelledby="results-title">
        {invalid && <p className="notice" role="alert">請輸入有效日期、開始時間與正整數分鐘。使用時段須在同一天內。</p>}
        {!searched && <><h2 id="results-title">已核對空間時段</h2>
          <div className="cards">{featured.map((library) => <LibraryCard key={library.id} library={library} area={library.areas.find((area) => area.kind === 'study' && area.slots?.length)} />)}</div>
        </>}
        {searched && !invalid && <>
          <div className="result-heading"><h2 id="results-title">查詢結果</h2><p>{date} · {start}–{clock(query.start + duration)}</p></div>
          {selected && <div className="notice"><strong>原定館舍：{selected.name}</strong> · {originalResult && statuses[originalResult.status]}
            {originalResult?.reasons.length ? ' · ' + originalResult.reasons.join('、') : ''}
            {' '}<Link href={href({ original: '' })}>清除原定館舍</Link></div>}
          {selected && <section className="backups" aria-label="備案比較">
            <h3>備案比較</h3>
            {backups.length ? <div className="cards">{backups.map(({ library, area, status, reasons }) =>
              <LibraryCard key={library.id + area?.name} {...{ library, area, status, reasons }} />)}</div> :
              <p>目前條件下沒有已確認符合的備案。可調整行政區、館名或其他條件再查詢。</p>}
          </section>}
          <nav className="tabs" aria-label="依查詢結果篩選">
            <Link aria-current={!statusFilter ? 'page' : undefined} href={href({ view: '', page: '' })}>全部 {results.length}</Link>
            {Object.entries(statuses).map(([key, label]) => <Link key={key} aria-current={statusFilter === key ? 'page' : undefined}
              href={href({ view: key, page: '' })}>{label} {results.filter(({ status }) => status === key).length}</Link>)}
          </nav>
          {!visible.length && <p className="notice">沒有符合此篩選的結果。</p>}
          <div className="cards">{visible.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item) =>
            <LibraryCard key={item.library.id + (item.area?.name ?? '')} {...item}
              originalLink={href({ original: item.library.id, q: '', page: '' })} />)}</div>
          {totalPages > 1 && <nav className="pager" aria-label="結果頁碼">
            {currentPage > 1 && <Link href={href({ page: String(currentPage - 1) })}>上一頁</Link>}
            <span>{currentPage} / {totalPages}</span>
            {currentPage < totalPages && <Link href={href({ page: String(currentPage + 1) })}>下一頁</Link>}
          </nav>}
        </>}
      </section>
      <footer>資料匯入 {new Date(snapshot.importedAt).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' })} · 出發前請查看最新館方公告</footer>
    </main>
  </>;
}

function LibraryCard({ library, area, status, reasons, closure, originalLink }: {
  library: Library;
  area?: Area;
  status?: keyof typeof statuses;
  reasons?: readonly string[];
  closure?: { url: string };
  originalLink?: string;
}) {
  return <article className="card">
    <div className="card-top"><span>{library.district}</span>{status && <span className={'badge ' + status}>{statuses[status]}</span>}</div>
    <h3>{library.name}</h3>
    <p className="area">{area?.name ?? (library.studyRoom === false ? '官方資料標示無自修室' : '閱覽空間待確認')}{area?.seats ? ' · ' + area.seats + ' 席' : ''}</p>
    <p className="address">{library.address || '地址待確認'}</p>
    {reasons?.length ? <ul className="reasons">{reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : null}
    <details>
      <summary>使用規則與來源</summary>
      <dl>
        <dt>入場</dt><dd>{area?.access === 'walk-in' ? '現場入座' : area?.access === 'card' ? '個人借閱證，須預約或現場登記' : area?.access === 'restricted' ? '限指定身分' :
          area?.access === 'conditional' ? '須符合校外訪客資格' : '待確認'}</dd>
        {library.reviewNote && !library.accessNote && <><dt>規則核對</dt><dd>{library.reviewNote}</dd></>}
        {library.accessNote && <><dt>館方補充</dt><dd>{library.accessNote}</dd></>}
        <dt>每週開放</dt><dd>{area?.slots?.map((slot) => <span className="slot" key={slot.day + ':' + slot.start}>
          週{weekdays[slot.day]} {clock(slot.start)}–{clock(slot.end)}</span>) ?? '空間時段待確認'}</dd>
        {!area?.slots && library.schedule?.length ? <><dt>館舍開放時間</dt><dd>{library.schedule.map((slot) =>
          <span className="slot" key={slot.day + ':' + slot.start}>週{weekdays[slot.day]} {clock(slot.start)}–{clock(slot.end)}</span>)}</dd></> : null}
        <dt>設備</dt><dd>{facilityKeys.map((key) => facilities[key] + ' ' +
          (area?.equipment[key] === true ? '有' : area?.equipment[key] === false ? '未提供' : '待確認')).join(' · ')}</dd>
        {library.facilities?.length ? <><dt>館舍設備</dt><dd>{library.facilities.join('、')}</dd></> : null}
        {library.phone && <><dt>電話</dt><dd>{library.phone}</dd></>}
      </dl>
      <div className="source-links">
        {library.website && <a href={library.website}>館方網站 ↗</a>}
        {area?.reservation && <a href={area.reservation}>官方座位預約 ↗</a>}
        {library.ruleLinks?.map((link, index) => <a key={link} href={link}>館方規則 {index + 1} ↗</a>)}
        {closure && <a href={closure.url}>休館來源 ↗</a>}
        {[...new Set([...(area?.sources ?? []), ...library.sources, ...(library.notices ?? [])])].map((source, index) =>
          <a href={source} key={source}>來源 {index + 1} ↗</a>)}
      </div>
    </details>
    {originalLink && <Link className="backup-link" href={originalLink}>以此館為原定地點找備案 →</Link>}
  </article>;
}
