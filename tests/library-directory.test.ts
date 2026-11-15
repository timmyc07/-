import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { Library } from '../lib/study.ts';
import { withLibraryDetail, withTaichungFax, type LibraryDetail } from '../lib/library-details.ts';
import { coversCalendarYear, evaluate, minutes, validDate } from '../lib/study.ts';
import { directionsUrl } from '../lib/distance.ts';

const root = new URL('../public/datasets/', import.meta.url);
const directory = JSON.parse(readFileSync(new URL('library-directory.json', root), 'utf8')) as {
  rawFile: string;
  sha256: string;
  count: number;
  rawCount: number;
  exclusions: { city: string; name: string }[];
  cityCounts: Record<string, number>;
  libraries: (Library & { city: string })[];
};

test('全臺名錄可追溯到原檔，保留 22 縣市且不填入未核對的空間規則', () => {
  const raw = readFileSync(new URL(directory.rawFile, root));
  const regions = JSON.parse(raw.toString('utf8')) as { 縣市: string; 圖書館資訊: { Name: string }[] }[];
  assert.equal(createHash('sha256').update(raw).digest('hex'), directory.sha256);
  assert.equal(regions.length, 22);
  assert.equal(regions.flatMap((region) => region.圖書館資訊).length, directory.rawCount);
  assert.equal(directory.libraries.length, directory.count);
  assert.equal(directory.count + directory.exclusions.length, directory.rawCount);
  assert.equal(new Set(directory.libraries.map(({ id }) => id)).size, directory.count);
  for (const region of regions) {
    const records = directory.libraries.filter((library) => library.city === region.縣市);
    const excluded = directory.exclusions.filter((item) => item.city === region.縣市).map(({ name }) => name);
    assert.equal(records.length, directory.cityCounts[region.縣市]);
    assert.deepEqual(records.map(({ name }) => name), region.圖書館資訊.map(({ Name }) => Name.trim())
      .filter((name) => !excluded.includes(name)));
    assert(records.every(({ areas, closures }) => areas.length === 0 && closures.length === 0));
  }
});

test('全臺名錄的電話與網址齊全，搬遷館舍不帶入舊址座標', () => {
  assert(directory.libraries.every(({ phone, website }) => phone && website));
  assert.deepEqual(directory.libraries.filter(({ coordinates }) => !coordinates).map(({ name }) => name),
    ['苗栗縣竹南鎮立圖書館']);
  const alishan = directory.libraries.find(({ id }) => id === 'plis-e1773325972df453b6c4');
  assert(alishan?.website && alishan.sources.includes(alishan.website));
  const yancheng = directory.libraries.find(({ id }) => id === 'plis-4818cd57388587303882');
  assert.deepEqual(yancheng?.coordinates, { latitude: 22.626505, longitude: 120.286221 });
  assert(yancheng.sources.some((source) => new URL(source).hostname === 'www.tbkc.gov.tw'));
});

test('傳真補錄保留來源，原始名錄明載無傳真的欄位持續有效', () => {
  const byName = (name: string) => directory.libraries.find((library) => library.name === name)!;
  const shilin = byName('臺北市立圖書館士林分館');
  assert.equal(shilin.fax, '02-28353985');
  assert(shilin.sources.includes('https://tpml.gov.taipei/cp.aspx?n=1F9AED300D314011'));
  assert.equal(byName('基隆市公共圖書館信義分館').fax, '02-24236174');
  assert.equal(byName('新北市立圖書館三峽分館').fax, '無');
  assert.equal(byName('高雄市立圖書館鹽埕分館').fax, undefined);
});

test('臺中快照採用同名同址的名錄傳真，搬遷或新增館舍保留待查', () => {
  const record = directory.libraries.find(({ name }) => name === '臺中市立圖書館大里大新分館')!;
  const branch = {
    ...record, id: 'taichung-daxin', name: '大里大新分館', address: '臺中市大里區大新街36之1號',
    fax: undefined, sources: ['https://www.library.taichung.gov.tw/'],
  };
  const result = withTaichungFax(branch, [record]);
  assert.equal(result.fax, '04-24965917');
  assert(result.sources.includes('https://data.gov.tw/dataset/99567'));
  const relocated = { ...branch, address: '臺中市大里區大新街38號' };
  assert.equal(withTaichungFax(relocated, [record]), relocated);
  assert.equal(withTaichungFax(branch, [record, record]), branch);
});

test('館舍詳情須同址，館舍開館及設備資料不當成自修室規則', () => {
  const library = directory.libraries.find(({ name }) => name === '基隆市公共圖書館中山分館')!;
  const detail: LibraryDetail = {
    address: '203 ' + library.address,
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000002',
    hours: '週二至週六 09:00–21:00',
    facilities: ['自修室', '無線上網wifi'],
  };
  const enriched = withLibraryDetail(library, detail);
  assert.equal(enriched.openingHours, detail.hours);
  assert.equal(enriched.studyRoom, true);
  assert.deepEqual(enriched.areas, [{
    name: '自修室', kind: 'study', slots: null, access: null, equipment: {}, sources: [detail.url],
  }]);
  assert.equal(withLibraryDetail(library, { ...detail, address: '基隆市中正區信一路190號' }), library);
  assert.equal(withLibraryDetail(library, { ...detail, facilities: ['電梯'] }).studyRoom, undefined);
});

test('專室時段採館方資料，施工閉館可排除查詢', () => {
  const { libraries: details } = JSON.parse(readFileSync(new URL('library-details.json', root), 'utf8')) as {
    libraries: Record<string, LibraryDetail>;
  };
  const libraries = directory.libraries.map((library) => withLibraryDetail(library, details[library.id]));
  assert(libraries.every(({ openingHours }) => openingHours));
  const xinyuan = libraries.find(({ id }) => id === 'plis-5931f90c2b78f1094592')!;
  assert.equal(xinyuan.address, '屏東縣新園鄉仙吉村新田路22巷21號');
  assert.deepEqual(xinyuan.coordinates, { latitude: 22.54066737, longitude: 120.45916455 });
  const gonghe = libraries.find(({ id }) => id === 'plis-f115f1f71be7cccd30e1')!;
  assert.match(gonghe.openingHours!, /08:00–12:00、13:00–17:00.*只開放一樓/);
  assert.equal(gonghe.areas.length, 0);
  const scheduled = libraries.flatMap(({ areas }) => areas).filter(({ slots }) => slots?.length);
  assert.equal(scheduled.length, 75);
  const nantou = libraries.find(({ id }) => id === 'plis-8e698a4770cf01e3875e')!;
  assert.equal(nantou.areas[0].seats, 147);
  const shoufeng = libraries.find(({ id }) => id === 'plis-c601d6fcc4e455f93f93')!;
  assert.equal(shoufeng.closures[0].until, '2026-12-08');
  const fonglin = libraries.find(({ id }) => id === 'plis-96bdb053d7e967f965dc')!;
  assert.deepEqual(fonglin.calendarYears, [2026]);
  assert(fonglin.closures.some(({ from, until }) => from === '2026-02-14' && until === '2026-02-23'));
  assert(fonglin.checkDates?.includes('2026-12-26'));
  const ruisi = libraries.find(({ id }) => id === 'plis-37cd73be99573999d94d')!;
  assert.match(ruisi.openingHours!, /溫泉路一段 1 號/);
  const jian = libraries.find(({ id }) => id === 'plis-1d71cbf4cd1d410256ad')!;
  assert.equal(jian.closures[0].until, '2026-10-08');
  const changhua = libraries.find(({ id }) => id === 'plis-b19f4a632868ac1ed335')!;
  assert.equal(changhua.areas[0].regionalCard, 'changhua');
  assert.equal(changhua.areas[0].seats, 70);
  assert.equal(changhua.closures[0].until, '2026-12-15');
  assert.equal(changhua.closures[1].time?.end, minutes('11:00'));
  const shengang = libraries.find(({ id }) => id === 'plis-61f904e8f436ea8fc25d')!;
  assert.equal(shengang.areas[0].access, 'walk-in');
  assert.equal(shengang.areas[0].equipment.laptop, false);
  assert.deepEqual(shengang.areas[0].slots?.find(({ day }) => day === 1),
    { day: 1, start: minutes('17:00'), end: minutes('20:00') });
  const yilan = libraries.find(({ id }) => id === 'plis-2fcff6be9344e712594c')!;
  assert.equal(yilan.closures[0].from, '2022-03-01');
  for (const { slots } of scheduled) {
    assert.equal(new Set(slots!.map(({ day }) => day)).size, slots!.length);
    assert(slots!.every(({ day, start, end }) => day >= 0 && day <= 6 && start < end && end <= 1440));
  }
  const pingzhen = libraries.find(({ id }) => id === 'plis-07c47313a8f5b473d2bf')!;
  assert.deepEqual(pingzhen.areas[0].slots?.find(({ day }) => day === 0),
    { day: 0, start: minutes('08:30'), end: minutes('17:00') });
  const taitung = libraries.find(({ id }) => id === 'plis-674920ab9a5621eaf6cf')!;
  assert.match(taitung.openingHours!, /09:00–21:00/);
  assert.equal(taitung.areas[0].seats, 98);
  assert.equal(taitung.areas[0].slots, null);
  const chenggong = libraries.find(({ id }) => id === 'plis-3dc026b916c043fe287e')!;
  assert.match(chenggong.openingHours!, /整修期間閱覽區週二至週日 08:00–17:00/);
  assert.deepEqual(chenggong.areas[0].slots?.[0], { day: 0, start: minutes('08:00'), end: minutes('17:00') });
  const huangbin = libraries.find(({ id }) => id === 'plis-eb5cc227330385ea9b00')!;
  const result = evaluate(huangbin, undefined, {
    date: '2026-11-15', start: minutes('14:00'), duration: 120, kind: 'study', card: false, registration: false, required: [],
  });
  assert.equal(result.status, 'no');
  assert.equal(result.closure?.from, '2026-03-02');
});

test('竹南新館依最新地址與自修室時段查詢，新竹依最新版自修室規定', () => {
  const { libraries: details } = JSON.parse(readFileSync(new URL('library-details.json', root), 'utf8')) as {
    libraries: Record<string, LibraryDetail>;
  };
  const get = (name: string) => {
    const library = directory.libraries.find((record) => record.name === name)!;
    return withLibraryDetail(library, details[library.id]);
  };
  const zhunan = get('苗栗縣竹南鎮立圖書館');
  assert.equal(zhunan.address, '苗栗縣竹南鎮大厝里真如路562號');
  assert.equal(zhunan.fax, undefined);
  assert.equal(new URL(directionsUrl(zhunan.address)).searchParams.get('destination'), zhunan.address);
  assert.equal(zhunan.areas[0].slots?.find(({ day }) => day === 6)?.end, minutes('18:00'));
  assert(zhunan.closures.some(({ from }) => from === '2026-11-28'));
  const simen = get('新竹市文化局圖書館西門自修室');
  assert.equal(simen.areas[0].seats, 216);
  assert.equal(simen.areas[0].equipment.outlet, true);
  assert.equal(simen.areas[0].slots?.find(({ day }) => day === 6)?.end, minutes('17:00'));
  assert.match(get('新竹市文化局圖書館').openingHours!, /閉館重建/);
});

test('臺南溫書窩採專室入場及設備規則，其他館舍的入座方式依個別證據', () => {
  const { libraries: details } = JSON.parse(readFileSync(new URL('library-details.json', root), 'utf8')) as {
    libraries: Record<string, LibraryDetail>;
  };
  const get = (name: string) => {
    const library = directory.libraries.find((record) => record.name === name)!;
    return withLibraryDetail(library, details[library.id]);
  };
  const main = get('臺南市立圖書館(新總館)');
  const area = main.areas[0];
  assert.equal(area.name, 'B1 溫書窩');
  assert.equal(area.seats, 130);
  assert.equal(area.equipment.laptop, false);
  const query = {
    date: '2026-11-28', start: minutes('14:00'), duration: 120, registration: true, card: false,
    kind: 'study' as const, required: [], regionalCards: ['tainan' as const],
  };
  assert.equal(evaluate(main, area, query).closure?.reason, '選舉日休館');
  assert.equal(evaluate(main, area, { ...query, date: '2026-11-29' }).status, 'yes');
  assert.equal(get('臺南市東區裕文圖書館').areas[0].access, 'walk-in');
  assert.equal(get('臺南市安南區土城圖書館').areas[0].slots, null);
});

test('高雄以館方自修室欄決定席次與時段，總館和分館依公告區別假日', () => {
  const { libraries: details } = JSON.parse(readFileSync(new URL('library-details.json', root), 'utf8')) as {
    libraries: Record<string, LibraryDetail>;
  };
  const libraries = directory.libraries.filter(({ city }) => city === '高雄市')
    .map((library) => withLibraryDetail(library, details[library.id]));
  assert.equal(libraries.filter(({ studyRoom }) => studyRoom === true).length, 27);
  assert.equal(libraries.filter(({ studyRoom }) => studyRoom === false).length, 34);
  assert.equal(libraries.filter((library) => coversCalendarYear(library, 2026)).length, 61);
  const cijin = libraries.find(({ name }) => name === '高雄市立圖書館旗津分館')!;
  assert.equal(cijin.areas[0].seats, 38);
  assert.equal(cijin.areas[0].access, 'walk-in');
  const query = {
    date: '2026-11-28', start: minutes('14:00'), duration: 120,
    kind: 'study' as const, card: false, registration: false, required: [],
  };
  assert.equal(evaluate(cijin, cijin.areas[0], query).closure?.reason, '選舉日休館');
  const main = libraries.find(({ name }) => name === '高雄市立圖書館')!;
  assert.equal(evaluate(main, undefined, query).closure, undefined);
  assert(main.checkDates?.includes(query.date));
});

test('雙北入座規則依館別套用，借閱證不可跨系統代用', () => {
  const { libraries: details } = JSON.parse(readFileSync(new URL('library-details.json', root), 'utf8')) as {
    libraries: Record<string, LibraryDetail>;
  };
  const get = (name: string) => {
    const library = directory.libraries.find((record) => record.name === name)!;
    return withLibraryDetail(library, details[library.id]);
  };
  const daoxiang = get('臺北市立圖書館稻香分館');
  const area = daoxiang.areas[0];
  assert.equal(area.seats, 93);
  const query = {
    date: '2026-11-15', start: minutes('14:00'), duration: 120,
    kind: 'study' as const, card: true, registration: true, required: [],
  };
  assert(evaluate(daoxiang, area, query).reasons.includes('需持臺北市圖個人借閱證'));
  assert.equal(evaluate(daoxiang, area, { ...query, regionalCards: ['taipei'] }).status, 'yes');
  const main = get('新北市立圖書館');
  assert(evaluate(main, main.areas[0], { ...query, registration: false, regionalCards: ['newTaipei'] })
    .reasons.includes('需現場登記'));
  const sanxia = get('新北市立圖書館三峽分館').areas[0];
  assert.equal(sanxia.access, 'walk-in');
  assert.equal(sanxia.equipment.outlet, false);
  assert.equal(get('新北市立圖書館三重東區分館').areas[0].equipment.outlet, undefined);
});

test('年度休館按館方範圍套用，部分開放與跨年時段各自判定', () => {
  const { libraries: details } = JSON.parse(readFileSync(new URL('library-details.json', root), 'utf8')) as {
    libraries: Record<string, LibraryDetail>;
  };
  const libraries = directory.libraries.map((library) => withLibraryDetail(library, details[library.id]));
  for (const { closures } of libraries) {
    assert(closures.every(({ from, until }) => validDate(from) && (!until || validDate(until) && until >= from)));
  }
  const query = {
    date: '2027-02-09', start: minutes('14:00'), duration: 120,
    kind: 'study' as const, card: false, registration: true, required: [],
    regionalCards: ['taipei'] as const,
  };
  const taipei = libraries.find(({ name }) => name === '臺北市立圖書館稻香分館')!;
  const taipeiQuery = { ...query, regionalCards: [...query.regionalCards] };
  assert.equal(evaluate(taipei, taipei.areas[0], taipeiQuery).status, 'no');
  assert.equal(evaluate(taipei, taipei.areas[0], { ...taipeiQuery, date: '2027-02-10' }).status, 'yes');
  const newTaipei = libraries.find(({ name }) => name === '新北市立圖書館三峽分館')!;
  assert.equal(evaluate(newTaipei, newTaipei.areas[0], { ...taipeiQuery, date: '2026-11-28' }).status, 'no');
  assert.equal(evaluate(newTaipei, newTaipei.areas[0], { ...taipeiQuery, date: '2026-06-25' }).status, 'unknown');
  assert.equal(coversCalendarYear(newTaipei, 2027), false);
  const ntl = libraries.find(({ name }) => name === '國立臺灣圖書館')!;
  assert.equal(evaluate(ntl, ntl.areas[0], { ...taipeiQuery, date: '2026-02-20' }).status, 'unknown');
  assert.equal(coversCalendarYear(libraries.find(({ name }) => name === '新北市烏來區立圖書館')!, 2026), false);
  const dayuan = libraries.find(({ name }) => name === '桃園市立圖書館大園分館')!;
  assert.equal(dayuan.areas[0].seats, 147);
  const taoyuanQuery = { ...taipeiQuery, regionalCards: ['taoyuan' as const] };
  assert.equal(evaluate(dayuan, dayuan.areas[0], { ...taoyuanQuery, date: '2026-11-26' }).status, 'no');
  assert.equal(evaluate(dayuan, dayuan.areas[0], { ...taoyuanQuery, date: '2026-11-27' }).status, 'yes');
  const qiding = libraries.find(({ name }) => name === '桃園市立圖書館崎頂分館')!;
  assert.match(evaluate(qiding, qiding.areas[0], { ...taoyuanQuery, date: '2026-11-27' }).closure!.reason, /搬遷/);
  const keelung = libraries.find(({ name }) => name === '基隆市公共圖書館總館')!;
  assert.equal(keelung.areas[0].regionalCard, 'keelung');
  assert.equal(keelung.areas[0].seats, 109);
  assert.equal(evaluate(keelung, keelung.areas[0], { ...taipeiQuery, date: '2026-02-21' }).status, 'no');
});
