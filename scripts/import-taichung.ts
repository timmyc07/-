import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { load } from 'cheerio';
import { parse } from 'csv-parse/sync';
import { mongoClient, snapshots } from '../lib/mongodb.ts';
import type { Library, Snapshot } from '../lib/study.ts';
import { branchHours, branchInfo, branchName, cityCalendar, cityDirectory, cityHours,
  cityNotices, cityRules, citySite, clean, dateKey, nationalCalendar, nclDirectory,
  nlpiArea, nlpiCalendar } from './taichung-sources.ts';

const cityJson = 'https://newdatacenter.taichung.gov.tw/api/v1/no-auth/resource.download?rid=654159e4-05e9-427c-bf0c-7facbd66e777';
const nclCsv = 'https://www.ncl.edu.tw/OpenDataFile/0Q112417873324994331/4cbfc49a-1127-45b1-9da6-113ebb444a12';
type Row = Record<string, string>;
const request = async (url: string) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(new URL(url).hostname + ' HTTP ' + response.status);
  return response;
};
const get = async (url: string) => new Uint8Array(await (await request(url)).arrayBuffer());
const html = async (url: string) => (await request(url)).text();
const districtOf = (address: string) => address.match(/^臺中市([^區]+區)/)?.[1] ?? '';
const idFor = (name: string, address: string) => 'ncl-' +
  createHash('sha256').update(name + '\0' + address).digest('hex').slice(0, 16);

async function importTaichung() {
  const [nclBytes, cityBytes, home, holidays, notices, rules, nationalHolidays] = await Promise.all([
    get(nclCsv), get(cityJson), html(citySite), html(cityHours), html(cityNotices), html(cityRules), html(nlpiCalendar),
  ]);
  const national: Row[] = parse(new TextDecoder('big5', { fatal: true }).decode(nclBytes), {
    columns: true, skip_empty_lines: true,
  });
  const city: Row[] = JSON.parse(new TextDecoder().decode(cityBytes));
  const taichung = national.filter((row) => clean(row['縣市'] ?? '') === '臺中市');
  if (taichung.length < 400 || !Array.isArray(city) || city.length < 40) {
    throw new Error('官方名錄筆數異常，保留既有資料');
  }
  const commonRules = load(rules)('.content_txt').text().replace(/\s/g, '');
  if (!commonRules.includes('自由入座') || !commonRules.includes('不提供插座充電')) {
    throw new Error('市圖自習區使用規則需要重新核對');
  }
  const calendar = cityCalendar(holidays);
  const nlpi = nationalCalendar(nationalHolidays);
  const noticePage = load(notices);
  const announcements = noticePage('.content_txt a[href*="Details?Parser="], a[href^="Details?Parser=9,3,41,27,"]')
    .toArray().map((link) => ({ label: clean(noticePage(link).text()), url: new URL(noticePage(link).attr('href')!, cityNotices).href }));
  if (!announcements.length) throw new Error('無法讀取市圖開館異動清單');
  const $ = load(home, { scriptingEnabled: false });
  const branches = new Map($('noscript a[href^="lib/index?"]').toArray().flatMap((link) => {
    const href = $(link).attr('href')!;
    const code = href.match(/\?(\d+)$/)?.[1];
    const name = clean($(link).text());
    return code && !name.includes('自助借還書站') ? [[branchName(name), { code, name, url: new URL(href, citySite).href }]] : [];
  }));
  if (branches.size < 45) throw new Error('市圖官方館舍清單不完整');
  const contact = new Map(city.map((row) => [branchName(row['館別']), row]));
  const libraries = new Map<string, Library>();
  const issues: string[] = [];
  for (const row of taichung) {
    const name = clean(row['中文館名'] ?? '');
    const address = clean(row['中文地址'] ?? '');
    const district = clean(row['區域'] ?? '');
    if (!name || !district) throw new Error('國圖名錄缺少館名或行政區');
    const types = row['圖書館類型'].split(',').map(clean);
    const branch = types.includes('公共圖書館') && branches.get(branchName(name));
    const id = branch ? 'tc-' + branch.code : idFor(name, address);
    const existing = libraries.get(id);
    if (existing) {
      existing.types = [...new Set([...existing.types, ...types])];
    } else {
      libraries.set(id, { id, name, district, address, types, sources: [nclDirectory], areas: [], closures: [] });
    }
  }

  for (const [key, branch] of branches) {
    const id = 'tc-' + branch.code;
    const previous = libraries.get(id);
    const cityContact = contact.get(key);
    const address = clean(cityContact?.['地址'] ?? previous?.address ?? '');
    const library: Library = {
      id, name: branch.code === '101' ? '臺中市立圖書館總館（綠美圖）' : branch.name,
      district: districtOf(address) || previous?.district || '', address,
      types: previous?.types ?? ['公共圖書館'],
      sources: [...(previous?.sources ?? []), ...(cityContact ? [cityDirectory] : []), branch.url, cityHours, cityNotices],
      phone: cityContact?.['市話'], website: branch.url, areas: [], closures: [], calendarYear: calendar.year,
    };

    await delay(400);
    const branchResponse = await request(branch.url);
    const page = await branchResponse.text();
    const times = branchHours(page);
    library.schedule = times.regular.length ? times.regular : undefined;
    const branchPage = load(page);
    let buildings: ReturnType<typeof branchInfo>['buildingAddresses'] = [];
    const introHref = branchPage('a[title="分館介紹"], a[title="總館介紹"]').first().attr('href');
    if (introHref) {
      const intro = new URL(introHref, branchResponse.url);
      if (intro.origin !== new URL(citySite).origin || !intro.pathname.toLowerCase().startsWith('/lib/introduction/')) {
        throw new Error('未識別的館舍介紹網址：' + intro.href);
      }
      await delay(400);
      const info = branchInfo(await html(intro.href));
      buildings = info.buildingAddresses;
      if (info.address && districtOf(info.address)) {
        library.address = info.address;
        library.district = districtOf(info.address);
      }
      library.phone = info.phone ?? library.phone;
      library.sources.push(intro.href);
      if (times.study.length || info.study) {
        library.areas.push({
          name: times.label || '自習室', kind: 'study',
          slots: times.study.length ? times.study : null,
          access: 'walk-in', equipment: { outlet: false },
          sources: [intro.href, branch.url, cityRules],
        });
      }
    } else if (times.study.length) {
      library.areas.push({
        name: times.label, kind: 'study', slots: times.study,
        access: 'walk-in', equipment: { outlet: false }, sources: [branch.url, cityRules],
      });
    }
    if (!library.address || !library.district) issues.push(library.name + '的聯絡資料待確認');

    library.checkDates = [];
    for (const holiday of calendar.holidays) {
      if (holiday.note && holiday.note.includes(branch.name)) {
        library.checkDates.push(holiday.date);
      } else if (!holiday.note || holiday.note.includes('配合文化中心開館')) {
        library.closures.push({ from: holiday.date, until: holiday.date, reason: holiday.reason + '休館', url: cityHours });
      } else {
        library.checkDates.push(holiday.date);
      }
    }
    // shortcut: 特殊時段須核對到空間，待確認後再套用空間時段。
    if (calendar.year === 2026) library.checkDates.push('2026-02-20', '2026-02-21');
    for (const notice of announcements.filter(({ label }) => label.includes(branch.name))) {
      const since = notice.label.match(/(\d{3})年(\d+)月(\d+)日/);
      if (since && /施工期間暫停開放/.test(notice.label)) {
        library.closures.unshift({ from: dateKey(Number(since[1]) + 1911, since[2], since[3]),
          reason: '整修期間暫停開放', url: notice.url });
      } else if (branch.code === '140' && notice.url.endsWith(',,,1941')) {
        library.closures.unshift({ from: '2026-01-26', until: '2026-11-16',
          reason: '潭子分館訂於 11 月 17 日啟用', url: notice.url });
        library.sources.push(citySite + 'latestevent/Details?Parser=9,3,41,27,,,1598');
      } else {
        library.notices = [...(library.notices ?? []), notice.url];
      }
    }
    if (buildings.length) {
      const siteWithStudy = buildings.find(({ address }) => address === library.address);
      for (const building of buildings) {
        const knownSite = building === siteWithStudy;
        const siteId = knownSite ? id : id + '-' + building.building.toLowerCase();
        libraries.set(siteId, { ...library, id: siteId, address: building.address,
          district: districtOf(building.address), name: library.name + building.building + '棟',
          phone: knownSite ? cityContact?.['市話'] : undefined, areas: knownSite ? library.areas : [] });
      }
      if (!siteWithStudy) {
        libraries.delete(id);
        issues.push(library.name + '的閱覽空間分棟待確認');
      }
    } else {
      libraries.set(id, library);
    }
  }

  const nlpiMain = [...libraries.values()].find((library) => library.name === '國立公共資訊圖書館');
  if (!nlpiMain) throw new Error('國圖名錄缺少國資圖總館');
  nlpiMain.website = 'https://www.nlpi.edu.tw/';
  nlpiMain.areas = [nlpiArea];
  nlpiMain.closures = nlpi.closures;
  nlpiMain.calendarYear = nlpi.year;
  nlpiMain.checkDates = ['2026-11-09'];
  nlpiMain.sources.push(nlpiCalendar);

  const peace = [...libraries.values()].find((library) => library.name === '臺中市和平區立圖書館');
  const peaceContact = contact.get('和平區立圖書館');
  if (peace) {
    peace.website = 'https://www.heping.taichung.gov.tw/4086049/post';
    peace.sources.push(peace.website);
    if (peaceContact) {
      peace.phone = peaceContact['市話'];
      peace.sources.push(cityDirectory);
    }
  }
  const snapshot: Snapshot = {
    _id: 'taichung', importedAt: new Date().toISOString(), issues,
    sourceCounts: { ncl: taichung.length, city: city.length, branches: branches.size },
    libraries: [...libraries.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant')),
  };
  if (new Set(snapshot.libraries.map((library) => library.district)).size < 29 ||
      !snapshot.libraries.some((library) => library.id === 'tc-105' && library.areas[0]?.slots?.length)) {
    throw new Error('匯入資料未通過行政區或大墩自習室檢查');
  }

  const client = mongoClient();
  try {
    await snapshots(client).replaceOne({ _id: snapshot._id }, snapshot, { upsert: true });
    console.log(JSON.stringify({ ...snapshot.sourceCounts, libraries: snapshot.libraries.length,
      areas: snapshot.libraries.flatMap((library) => library.areas).length,
      checkedSlots: snapshot.libraries.filter((library) => library.areas.some((area) => area.slots)).length,
      issues }, null, 2));
  } finally {
    await client.close();
  }
}

importTaichung().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : '匯入失敗');
  process.exitCode = 1;
});
