import Form from 'next/form';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArrowUpDown, Baby, BookOpen, CalendarDays, Check, Clock, Fax, IdCard, Laptop, LibraryBig, List,
  MapPin, Phone, Plug, Route, Search, Wifi } from '../action-icons.ts';
import DurationField from '../duration-field.tsx';
import AutoDistance from './auto-distance.tsx';
import CardDetails from './card-details.tsx';
import CardPhoto, { CardPhotoPlaceholder } from './card-photo.tsx';
import Pagination from './pagination.tsx';
import AdvancedFilters from './advanced-filters.tsx';
import EquipmentFilters from './equipment-filters.tsx';
import ResultLayout, { LayoutControls, LayoutField, LayoutLink } from './result-layout.tsx';
import RegionFilters from '../region-filters.tsx';
import directory from '../../public/datasets/library-directory.json';
import { libraryCatalog, type RegionalLibrary } from '../../lib/library-catalog.ts';
import { directionsUrl, distanceKm, parseCoordinates } from '../../lib/distance.ts';
import { backupLibraries, clock, documentLabels, entryDocumentRequirement, evaluate, facilities, kindLabels,
  regionalCards, weekdays } from '../../lib/study.ts';
import type { Area, DocumentRequirement, Facility, Query, Slot } from '../../lib/study.ts';
import { pilotVisit } from '../../lib/taichung-visits.ts';
import { libraryPhotoCredits, type LibraryPhotoCredit } from '../../lib/mongodb.ts';
import { normalizeSearchText, requestedPage, searchRegion, searchTime } from '../../lib/search-query.ts';

type Params = Record<string, string | string[] | undefined>;
export const metadata: Metadata = { title: '查詢自修空間｜StudyGo' };
const facilityKeys = Object.keys(facilities) as Facility[];
const facilityIcons = { laptop: Laptop, wifi: Wifi, outlet: Plug };
const facilityGroups = [
  { title: '閱讀與討論', Icon: BookOpen, match: /自[修習]|討論|研討|閱[讀覽]|書報|期刊/u },
  { title: '網路與資訊', Icon: Wifi, match: /上網|wi[\s-]?fi|網路|筆電|電腦|檢索|多媒體|插座|充電|視聽/iu },
  { title: '借閱服務', Icon: LibraryBig, match: /借書|還書|借還|借閱|預約取書|取書機/u },
  { title: '親子設施', Icon: Baby, match: /親子|哺|集乳|嬰幼兒|尿布|兒童室/u },
  { title: '出入與交通', Icon: ArrowUpDown, match: /電梯|升降|無障礙|坡道|停車|[iu]bike|自行車/iu },
];
const otherFacilities = { title: '其他設備', Icon: List };
const statuses = { yes: '符合條件', unknown: '待確認', no: '不符合' } as const;
const pageSize = 15;

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const get = (key: string) => typeof params[key] === 'string' ? params[key] : undefined;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', dateStyle: 'short' }).format(new Date());
  const time = searchTime(today, get('date'), get('start'), get('duration'));
  const checkTime = get('availability') === '1';
  const requestedKind = get('kind');
  const kind = requestedKind && Object.hasOwn(kindLabels, requestedKind) ? requestedKind as Area['kind'] : '';
  const equipment = facilityKeys.filter((key) => get(key) === 'on');
  const requestedDocuments = get('documents');
  const documentFilter = requestedDocuments === 'required' || requestedDocuments === 'none' ? requestedDocuments : '';
  const keyword = (get('q') ?? '').trim().slice(0, 100);
  const original = get('original') ?? '';
  const position = parseCoordinates(get('position'));
  const page = requestedPage(get('page'));
  const searched = get('search') === '1';
  const query: Query = { date: time.date, start: time.startMinute, duration: time.duration, kind, required: equipment };

  const { libraries } = await libraryCatalog();
  const regions = new Map(Object.keys(directory.cityCounts).map((name) => [name, new Set<string>()]));
  for (const library of libraries) if (library.district) regions.get(library.city)!.add(library.district);
  const districtsByCity = Object.fromEntries([...regions].map(([name, districts]) =>
    [name, [...districts].sort((a, b) => a.localeCompare(b, 'zh-Hant'))]));
  const districtParam = get('district');
  const { city, district, invalidRegion } = searchRegion(districtsByCity, get('city') ?? (districtParam ? '臺中市' : ''), districtParam);
  const formKey = JSON.stringify(Object.entries(params).filter(([key]) => !['page', 'layout', 'sources', 'position'].includes(key)).sort());
  const selected = libraries.find((library) => library.id === original);
  const detailed = Boolean(checkTime || city || kind || documentFilter || time.changed || equipment.length || selected);
  const invalid = time.invalidTime || invalidRegion;
  const normalizedKeyword = normalizeSearchText(keyword);
  const candidates = libraries.filter((library) => (!city || library.city === city) && (!district || library.district === district) &&
    (!normalizedKeyword || normalizeSearchText(library.name + ' ' + library.address).includes(normalizedKeyword)));
  const evaluateLibrary = (library: RegionalLibrary) => {
    const matching = kind ? library.areas.filter((area) => area.kind === kind) : library.areas;
    const areas: (Area | undefined)[] = matching.length ? matching : [undefined];
    const distance = distanceKm(position, library.coordinates);
    return areas.map((area) => ({ library, distance, ...evaluate(library, area, query) }))
      .filter(({ documents }) => !documentFilter || documents === documentFilter);
  };
  const rank = { yes: 0, unknown: 1, no: 2 };
  type Result = ReturnType<typeof evaluateLibrary>[number];
  const compareDistance = (a: { distance?: number }, b: { distance?: number }) =>
    (a.distance ?? Number.MAX_VALUE) - (b.distance ?? Number.MAX_VALUE);
  const compareStatus = (a: Result, b: Result) => rank[a.status] - rank[b.status];
  const compareResults = (a: Result, b: Result) => compareStatus(a, b) || compareDistance(a, b);
  const evaluated = !invalid && detailed ? candidates.flatMap(evaluateLibrary).sort(compareResults) : [];
  const sample = !detailed && !position && !searched && !keyword;
  const browse = !sample ? candidates : candidates.filter(({ areas }) => areas.some((area) =>
    area.kind === 'study' && area.slots?.length && (area.access === 'walk-in' || area.access === 'card'))).slice(0, 4);
  const results = detailed ? evaluated : browse.map((library) => ({
    library,
    area: library.areas.find((area) => area.kind === 'study') ?? library.areas[0],
    distance: distanceKm(position, library.coordinates),
  })).sort(compareDistance);
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const currentPage = Math.min(totalPages, page);
  const backupOrigin = position ?? selected?.coordinates;
  const backups = selected ? backupLibraries(position ? evaluated : evaluated.map((item) => ({
    ...item, distance: distanceKm(backupOrigin, item.library.coordinates),
  })).sort(compareResults), original) : [];
  const originalResult = !invalid && selected ? evaluateLibrary(selected).sort(compareStatus)[0] : undefined;
  const visibleResults = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const photoIds = invalid ? [] : [...new Set([...visibleResults, ...backups].map(({ library }) => library.id))];
  const photos = libraryPhotoCredits(photoIds).catch(() => undefined);
  const resultsKey = JSON.stringify([formKey, currentPage, position]);

  function href(changes: Record<string, string>) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === 'sources' || key === 'photos' || key === 'layout') continue;
      if (typeof value === 'string') next.set(key, value);
    }
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    return '/search' + (next.size ? '?' + next : '') + '#results';
  }

  return <main className="search-page">
      <section className="shell search-intro" aria-labelledby="search-page-title">
        <h1 id="search-page-title">查詢自修空間</h1>
      </section>
      <Form key={formKey} id="search" className="shell search" action="/search#results" aria-labelledby="search-page-title">
        <input type="hidden" name="search" value="1" />
        {position && <input type="hidden" name="position" value={get('position')} />}
        <LayoutField />
        {selected && <input type="hidden" name="original" value={selected.id} />}
        <div className="keyword-search">
          <input aria-label="館名或地址" type="search" name="q" maxLength={100} defaultValue={keyword} placeholder="搜尋館名或地址" />
          <button type="submit" aria-label="搜尋" title="搜尋"><Search size={19} aria-hidden="true" /></button>
        </div>
        <div className="search-options">
          <EquipmentFilters>
            {facilityKeys.map((key) => {
              const Icon = facilityIcons[key];
              return <label key={key}>
                <span className="check-control"><input type="checkbox" name={key} defaultChecked={equipment.includes(key)} />
                  <Check size={13} aria-hidden="true" /></span>
                <span className="filter-label"><Icon size={16} />{facilities[key]}</span></label>;
            })}
          </EquipmentFilters>
          {!invalid && <LayoutControls />}
        </div>
        <AdvancedFilters checkTime={checkTime}>
          <RegionFilters initialCity={city} initialDistrict={district} districtsByCity={districtsByCity} />
          <label><span className="filter-label"><CalendarDays size={16} />日期</span><input type="date" name="date" defaultValue={time.formDate} required /></label>
          <label><span className="filter-label"><Clock size={16} />開始時間</span><input type="time" name="start" defaultValue={time.formStart} required /></label>
          <DurationField minutes={time.formDuration} />
          <label><span className="filter-label"><LibraryBig size={16} />空間類型</span><select name="kind" defaultValue={kind}><option value="">所有空間</option>
            {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span className="filter-label"><IdCard size={16} />入場證件</span>
            <select name="documents" defaultValue={documentFilter}>
              <option value="">不限</option>
              <option value="none">{documentLabels.none}</option>
              <option value="required">{documentLabels.required}</option>
            </select>
          </label>
        </AdvancedFilters>
      </Form>
      <ResultLayout>
        <AutoDistance />
        <div key={resultsKey} className="result-set">
          {time.invalidTime && <p className="notice" role="alert">日期或時段無效。請在進階篩選確認日期與分鐘數後重新查詢，使用時段須在同一天內。</p>}
          {invalidRegion && <p className="notice" role="alert">縣市或行政區不相符。請在進階篩選重新選擇地區。</p>}
          {!invalid && <>
            {sample && <div className="result-tools">
              <LayoutLink className="outline-link" href={href({ search: '1' })}>查看全部館舍</LayoutLink>
            </div>}
            {selected && <div className="notice"><strong>原定館舍：{selected.name}</strong> · {originalResult
              ? statuses[originalResult.status] : '沒有符合所選證件條件的空間'}
              {originalResult?.area && ' · ' + originalResult.area.name}
              {originalResult?.reasons.length ? ' · ' + originalResult.reasons.join('、') : ''}
              {' '}<LayoutLink href={href({ original: '', page: '' })}>清除原定館舍</LayoutLink></div>}
            {selected && <section className="backups" aria-label="備案比較">
              <h3>備案比較</h3>
              {backupOrigin && <p className="distance-note">以{position ? '定位起點' : '原定館舍'}為起點，依直線距離排序</p>}
              {backups.length ? <div className="cards">{backups.map((item) =>
                <LibraryCard key={item.library.id} {...item} photos={photos}
                  distance={position ? item.distance : undefined} />)}</div> :
                <p>目前條件下沒有已確認符合的備案。{' '}
                  {city || keyword ? <LayoutLink href={href({ city: '', district: '', q: '', page: '' })}>擴大到全臺灣</LayoutLink> : '可調整條件再查詢。'}
                </p>}
            </section>}
            {!results.length && <p className="notice">沒有符合此篩選的結果。</p>}
            <div className="cards">{visibleResults.map((item) =>
              <LibraryCard key={item.library.id + (item.area?.name ?? '')} {...item}
                photos={photos}
                originalLink={item.library.id === original ? undefined : href({ original: item.library.id, q: '', page: '' })} />)}</div>
            {totalPages > 1 && <Pagination page={currentPage} total={totalPages}
              previous={currentPage > 1 ? href({ page: String(currentPage - 1) }) : undefined}
              next={currentPage < totalPages ? href({ page: String(currentPage + 1) }) : undefined} />}
          </>}
        </div>
      </ResultLayout>
    </main>;
}

type CardPhotos = Promise<Map<string, LibraryPhotoCredit> | undefined>;

async function LibraryPhoto({ library, photos }: { library: RegionalLibrary; photos: CardPhotos }) {
  return (await photos)?.has(library.id)
    ? <CardPhoto id={library.id} name={library.name} />
    : <CardPhotoPlaceholder />;
}

function HoursTimeline({ slots }: { slots: Slot[] }) {
  return <ul className="hours-timeline" role="list">{slots.map(({ day, start, end }) =>
    <li key={day + ':' + start}><span className="hours-period">週{weekdays[day]}</span> <strong>{clock(start)}–{clock(end)}</strong></li>)}</ul>;
}

function AnnouncedHours({ hours }: { hours: string }) {
  // Only separate ranges that share one explicit weekday label.
  const schedule = /^(週[^0-9。；：\n]+?)\s+(\d{1,2}:\d{2}[–—-]\d{1,2}:\d{2}(?:、\s*\d{1,2}:\d{2}[–—-]\d{1,2}:\d{2})*)(?:。([\s\S]*))?$/u.exec(hours.trim());
  if (!schedule) return hours;
  const [, days, ranges, note] = schedule;
  return <>
    <span>{days}</span>
    <ul className="hours-timeline" role="list">{ranges.split('、').map((range, index) =>
      <li key={index}><strong>{range.trim()}</strong></li>)}</ul>
    {note?.trim()}
  </>;
}

function LibraryFacilities({ items }: { items: string[] }) {
  const grouped = Map.groupBy(items, (item) => facilityGroups.find(({ match }) => match.test(item)) ?? otherFacilities);
  return <dl className="library-facilities">{[...facilityGroups, otherFacilities].map((group) => {
    const names = grouped.get(group);
    if (!names) return null;
    const { title, Icon } = group;
    return <div key={title} data-icon-trigger>
      <dt><Icon className="action-icon" size={17} aria-hidden="true" />{title}</dt>
      <dd>{names.map((name, index) =>
        <span key={index}>{name}{index < names.length - 1 && '、'}</span>)}</dd>
    </div>;
  })}</dl>;
}

function LibraryCard({ library, area, documents = entryDocumentRequirement(area), status, reasons, closure, openUntil, distance, originalLink, photos }: {
  library: RegionalLibrary;
  area?: Area;
  documents?: DocumentRequirement;
  status?: keyof typeof statuses;
  reasons?: readonly string[];
  closure?: { reason: string; url: string };
  openUntil?: number;
  distance?: number;
  originalLink?: string;
  photos: CardPhotos;
}) {
  const visit = area && pilotVisit(library.id, area);
  const photo = <Suspense fallback={<CardPhotoPlaceholder loading />}>
    <LibraryPhoto library={library} photos={photos} />
  </Suspense>;
  return <article className="card">
    {photo}
    <header className="card-heading">
      {status && <span className={'card-status badge ' + status}>{statuses[status]}</span>}
      <h3>{library.name}</h3>
      <p className="address">{library.address || '地址待確認'}</p>
    </header>
    <CardDetails name={library.name}>
      {photo}
      <p className="address">{library.city}{library.district && ' · ' + library.district}</p>
      <p className="area">{area?.name ?? (library.studyRoom === false ? '無獨立自修室' : '閱覽空間待確認')}{area?.seats ? ' · ' + area.seats + ' 席' : ''}</p>
      <p className="address">{library.address || '地址待確認'}</p>
      <dl className="card-facts">
        <div><dt>證件</dt><dd className="entry-documents">{documentLabels[documents]}</dd></div>
        {openUntil !== undefined && <div><dt>可用至</dt><dd className="open-until">{clock(openUntil)}</dd></div>}
      </dl>
      {reasons?.length ? <ul className="reasons">{reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : null}
      {visit && <dl className="visit-details">
        <div><dt>樓層</dt><dd>{visit.location}</dd></div>
        <div><dt>入座</dt><dd>{visit.entry}</dd></div>
        <div><dt>充電</dt><dd>{visit.power}</dd></div>
      </dl>}
      <div className="card-actions">
        {(library.coordinates || library.address) && <a className="map-link" href={directionsUrl(library.coordinates ?? library.address)}
          aria-label={library.name + ' Google 地圖導航'}><MapPin className="action-icon" size={17} />地圖導航</a>}
        {!closure && area?.reservation && <a href={area.reservation}><CalendarDays className="action-icon" size={17} />前往館方預約</a>}
        {library.phone && <a href={'tel:' + library.phone}><Phone className="action-icon" size={17} />電話 {library.phone}</a>}
        {library.fax && <span className="card-fax" data-icon-trigger><Fax className="action-icon" size={17} />傳真 {library.fax}</span>}
      </div>
      <section className="card-rules">
        <h3>使用規則</h3>
        <dl className="rule-details">
          <dt>入場</dt><dd>{area?.entryNote ?? (area?.access === 'walk-in' ? '現場入座' : area?.access === 'card'
            ? '需持' + (area.regionalCard ? regionalCards[area.regionalCard] : '國資圖或臺中市圖個人借閱證') + '，須預約或現場登記' : area?.access === 'restricted' ? '限指定身分' :
            area?.access === 'conditional' ? '須符合校外訪客資格' : '待確認')}</dd>
          {library.reviewNote && !library.accessNote && <><dt>規則核對</dt><dd>{library.reviewNote}</dd></>}
          {library.accessNote && <><dt>館方補充</dt><dd>{library.accessNote}</dd></>}
          <dt>每週開放</dt><dd>{area?.slots?.length ? <HoursTimeline slots={area.slots} /> : '空間時段待確認'}</dd>
          {!area?.slots?.length && library.schedule?.length ? <><dt>館舍開放時間</dt><dd><HoursTimeline slots={library.schedule} /></dd></> : null}
          {library.openingHours && <><dt>館方公告的開放時間</dt><dd className="opening-hours"><AnnouncedHours hours={library.openingHours} /></dd></>}
          <dt>設備</dt><dd>{facilityKeys.map((key) => facilities[key] + ' ' +
            (area?.equipment[key] === true ? '有' : area?.equipment[key] === false ? '未提供' : '待確認')).join(' · ')}</dd>
          {library.facilities?.length ? <><dt>館舍設備</dt><dd><LibraryFacilities items={library.facilities} /></dd></> : null}
        </dl>
        <div className="source-links">
          {library.website && <a href={library.website}>館方網站 ↗</a>}
          <a href="/?sources=1#source-index">查看逐館來源索引</a>
        </div>
      </section>
      {originalLink && <LayoutLink className="backup-link" href={originalLink}><Route className="action-icon" size={17} />以此館為原定地點找備案</LayoutLink>}
    </CardDetails>
    {distance !== undefined && <footer className="card-distance"><MapPin size={15} aria-hidden="true" />距定位起點約 {
      distance < 1 ? Math.round(distance * 1000) + ' 公尺' : distance.toFixed(1) + ' 公里'}</footer>}
  </article>;
}
