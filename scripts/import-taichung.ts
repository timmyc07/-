import { setTimeout as delay } from 'node:timers/promises';
import { load } from 'cheerio';
import { mongoClient, snapshots } from '../lib/mongodb.ts';
import type { Library, Snapshot } from '../lib/study.ts';
import { addressKey, applyPublicEvidence, cityFacilities, laptopFaq, limingName, municipalFacilities,
  publicEvidence, readingRules, reviewedSources, studyLocations, verifiedCoordinates, wifiFaq } from './public-library-data.ts';
import { readRuleAudit } from './crawl-taichung-rules.ts';
import { branchHours, branchInfo, branchName, cityCalendar, cityDirectory, cityHours,
  cityNotices, cityRules, citySite, cityWeatherClosures, clean, dateKey, nationalCalendar,
  nlpiArea, nlpiCalendar, nlpiQuietArea, nlpiWeatherClosures } from './taichung-sources.ts';

const cityJson = 'https://newdatacenter.taichung.gov.tw/api/v1/no-auth/resource.download?rid=654159e4-05e9-427c-bf0c-7facbd66e777';
type Row = Record<string, string>;
const request = async (url: string) => {
  let response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (response.status === 429 || response.status >= 500) {
    const retry = Number(response.headers.get('Retry-After'));
    await response.body?.cancel();
    await delay(retry > 0 ? Math.min(retry, 60) * 1000 : 1600);
    response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  }
  if (!response.ok) throw new Error('HTTP ' + response.status + ' · ' + url);
  return response;
};
const get = async (url: string) => new Uint8Array(await (await request(url)).arrayBuffer());
const html = async (url: string) => (await request(url)).text();
const districtOf = (address: string) => address.match(/^臺中市([^區]+區)/)?.[1] ?? '';
const nonMunicipalPublicIds = new Map([
  ['國立公共資訊圖書館', 'ncl-3aa0574ed94d0f22'],
  [limingName, 'ncl-1ba74ad50e9db0a9'],
  ['臺中市和平區立圖書館', 'ncl-a37723154b3ab4dc'],
]);

async function importTaichung() {
  const [cityBytes, home, holidays, notices, rules, nationalHolidays, publicLibraries, facilityPage, laptopPage, wifiPage, ruleAudit] = await Promise.all([
    get(cityJson), html(citySite), html(cityHours), html(cityNotices), html(cityRules), html(nlpiCalendar),
    publicEvidence(html), html(cityFacilities), html(laptopFaq), html(wifiFaq), readRuleAudit(),
  ]);
  const city: Row[] = JSON.parse(new TextDecoder().decode(cityBytes));
  if (!Array.isArray(city) || city.length < 40) {
    throw new Error('市府聯絡資訊筆數異常，保留既有資料');
  }
  const commonRules = load(rules)('.content_txt').text().replace(/\s/g, '');
  if (!commonRules.includes('自由入座') || !commonRules.includes('不提供插座充電')) {
    throw new Error('市圖自習區使用規則需要重新核對');
  }
  if (!load(laptopPage)('main').text().includes('可攜帶筆記型電腦') ||
      !load(wifiPage)('main').text().replace(/\s/g, '').includes('各分館館內均有提供無線上網服務')) {
    throw new Error('市圖設備規則需要重新核對');
  }
  const branchFacilities = municipalFacilities(facilityPage);
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
  const issues = [...publicLibraries.errors];
  for (const [key, evidence] of publicLibraries.records) {
    if (branches.has(key)) continue;
    const { row, details } = evidence;
    const name = clean(row.Name);
    const id = nonMunicipalPublicIds.get(name);
    if (!id) continue;
    const address = clean(row.Address).replace(/^\d{3,6}\s*/, '');
    const district = districtOf(address);
    if (!district || !details) throw new Error('公立館舍資料不完整：' + name);
    const library: Library = {
      id, name, district, address, types: ['公共圖書館'], sources: [],
      website: row.URL && URL.canParse(row.URL) ? row.URL : undefined,
      studyRoom: details.study || undefined, schedule: details.schedule.regular.length ? details.schedule.regular : undefined,
      areas: [], closures: [],
    };
    applyPublicEvidence(library, evidence);
    libraries.set(id, library);
  }
  for (const [name, id] of nonMunicipalPublicIds) {
    if (!libraries.has(id)) throw new Error('公立館舍名錄缺少：' + name);
  }

  for (const [key, branch] of branches) {
    const id = 'tc-' + branch.code;
    const cityContact = contact.get(key);
    const publicInfo = publicLibraries.records.get(key);
    const listed = branchFacilities.get(branch.code);
    const publicRoom = publicInfo?.details;
    const confirmedStudy = publicRoom?.schedule.study ?? [];
    const wifi = listed?.includes('無線上網') ? true : undefined;
    const studyEquipment = { outlet: false, laptop: true, wifi };
    const studyRules = [cityRules, laptopFaq, ...(wifi ? [wifiFaq, cityFacilities] : [])];
    const address = clean(cityContact?.['地址'] ?? publicInfo?.row.Address ?? '').replace(/^\d{3,6}\s*/, '');
    const library: Library = {
      id, name: branch.code === '101' ? '臺中市立圖書館總館（綠美圖）' : branch.name,
      district: districtOf(address), address,
      types: ['公共圖書館'],
      sources: [...(cityContact ? [cityDirectory] : []), branch.url, cityHours, cityNotices],
      phone: cityContact?.['市話'], website: branch.url, areas: [], closures: [...cityWeatherClosures], calendarYear: calendar.year,
      facilities: listed,
    };

    await delay(400);
    const branchResponse = await request(branch.url);
    const page = await branchResponse.text();
    const times = branchHours(page);
    const regular = times.regular.length ? times.regular : publicRoom?.schedule.regular;
    const studySlots = times.study.length ? times.study : confirmedStudy;
    library.schedule = regular?.length ? regular : undefined;
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
      const hasStudy = studySlots.length > 0 || info.study || (!info.noStudy &&
        (Boolean(publicRoom?.study) || Boolean(listed?.some((item) => /自[修習]室/.test(item)))));
      library.studyRoom = hasStudy ? true : info.noStudy ? false : undefined;
      if (hasStudy) {
        library.areas.push({
          name: times.label || publicRoom?.schedule.label || '自習室', kind: 'study',
          slots: studySlots.length ? studySlots : null,
          access: 'walk-in', seats: info.studySeats, equipment: studyEquipment,
          sources: [intro.href, branch.url, ...(publicRoom ? [publicRoom.url] : []), ...studyRules],
        });
      }
      if (info.readingSeats && !buildings.length) {
        library.areas.push({
          name: '一般閱覽座位', kind: 'reading', slots: library.schedule ?? null, access: 'walk-in',
          seats: info.readingSeats, equipment: { wifi },
          sources: [intro.href, branch.url, readingRules, ...(wifi ? [wifiFaq, cityFacilities] : [])],
        });
      }
    } else if (studySlots.length) {
      library.studyRoom = true;
      library.areas.push({
        name: times.label || '自習室', kind: 'study', slots: studySlots,
        access: 'walk-in', equipment: studyEquipment, sources: [branch.url, ...studyRules],
      });
    }
    const studyArea = library.areas.find((area) => area.kind === 'study');
    const location = studyLocations[branch.code];
    if (studyArea && location) {
      const [name, guide] = location;
      studyArea.name = name;
      studyArea.sources.push(citySite + 'lib/content/index?Parser=1,' + branch.code + ',' + guide);
    }
    applyPublicEvidence(library, publicInfo);
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
    const buildingClosures = new Map<string, Library['closures']>();
    for (const notice of announcements.filter(({ label }) => label.includes(branch.name))) {
      const since = notice.label.match(/(\d{3})年(\d+)月(\d+)日/);
      if (since && /施工期間暫停開放/.test(notice.label)) {
        const closure = { from: dateKey(Number(since[1]) + 1911, since[2], since[3]),
          reason: '整修期間暫停開放', url: notice.url };
        const building = buildings.find((site) => notice.label.includes(branch.name + site.building + '棟'));
        if (building) {
          buildingClosures.set(building.building, [closure, ...(buildingClosures.get(building.building) ?? [])]);
        } else {
          library.closures.unshift(closure);
        }
      } else if (notice.url !== reviewedSources[library.name]?.reopening) {
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
          coordinates: knownSite ? library.coordinates : undefined, studyRoom: knownSite ? library.studyRoom : undefined,
          facilities: knownSite ? library.facilities : library.facilities?.filter((facility) => !/自[修習]室|筆電席位/.test(facility)),
          closures: [...(buildingClosures.get(building.building) ?? []), ...library.closures],
          phone: building.phone ?? (knownSite ? cityContact?.['市話'] : undefined), areas: knownSite ? library.areas : [] });
      }
      if (!siteWithStudy) {
        libraries.delete(id);
        issues.push(library.name + '的閱覽空間分棟待確認');
      }
    } else {
      libraries.set(id, library);
    }
  }

  for (const library of libraries.values()) {
    const site = verifiedCoordinates[library.id];
    if (site && addressKey(site[0]) === addressKey(library.address)) {
      const [, latitude, longitude, source] = site;
      library.coordinates = { latitude, longitude };
      library.sources.push(source);
    }
    const review = reviewedSources[library.name];
    if (!review) continue;
    if (review.website) {
      library.website = review.website;
      library.sources.push(review.website);
    }
    library.sources.push(...(review.sources ?? []));
    if (review.accessNote) library.accessNote = review.accessNote;
    if (review.areas) library.areas = review.areas;
    if (review.areaUpdates) {
      const areas = new Map(library.areas.map((area) => [area.name, area]));
      for (const area of review.areaUpdates) areas.set(area.name, area);
      library.areas = [...areas.values()];
    }
    const reading = library.areas.find((area) => area.name === '一般閱覽座位');
    if (review.schedule) library.schedule = review.schedule;
    if (reading && (review.readingEquipment || review.schedule || review.readingLimitedOpening)) {
      if (review.readingEquipment) reading.equipment = { ...reading.equipment, ...review.readingEquipment };
      if (review.schedule) reading.slots = review.schedule;
      if (review.readingLimitedOpening) reading.limitedOpening = review.readingLimitedOpening;
      reading.sources = [...new Set([...reading.sources, ...(review.sources ?? [])])];
    }
    for (const area of [...(review.areas ?? []), ...(review.areaUpdates ?? [])]) library.sources.push(...area.sources);
    if (review.closures) {
      const updatedUrls = new Set(review.closures.map((closure) => closure.url));
      library.closures = [...review.closures, ...library.closures.filter((closure) => !updatedUrls.has(closure.url))];
    }
    if (review.checkDates) library.checkDates = [...new Set([...(library.checkDates ?? []), ...review.checkDates])];
    if (review.studyRoom === false) {
      library.areas = library.areas.filter((area) => area.kind !== 'study');
      library.facilities = library.facilities?.filter((facility) => !/自[修習]室/.test(facility));
    }
    if (review.studyRoom !== undefined) library.studyRoom = review.studyRoom ?? undefined;
    else if (library.areas.some((area) => area.kind === 'study')) library.studyRoom = true;
    if (library.name === limingName) {
      library.closures = [...nlpiWeatherClosures, ...nlpi.limingClosures];
      library.calendarYear = nlpi.year;
      library.checkDates = nlpi.adjustedDates;
      library.sources.push(nlpiCalendar);
    }
  }
  const nlpiMain = [...libraries.values()].find((library) => library.name === '國立公共資訊圖書館');
  if (!nlpiMain) throw new Error('公立公共圖書館名錄缺少國資圖總館');
  nlpiMain.website = 'https://www.nlpi.edu.tw/';
  nlpiMain.areas = [nlpiArea, nlpiQuietArea];
  nlpiMain.accessNote = 'B1 自修閱覽室須持國資圖或臺中市立圖書館本人實體個人借閱證，可線上預約或現場登記。已預約者於使用日 08:30 前報到，現場登記取得座位號後須於 10 分鐘內報到。2026 年 10 月 12 日全天及 11 月 9 日 09:30–12:30 維護期間，館方公告可直接入座。4、5 樓部分一般閱覽席開放自修，免借閱證及預約，館藏閱覽優先。1 至 3 樓及資訊檢索區、館藏保留席、休憩小站、筆電專區禁止自修。2 至 5 樓共 46 席筆電優先席，館內充電限各樓櫃檯附近的充電站，每次以 30 分鐘為原則，充電站無座位。12 歲以下讀者請使用兒童學習中心。自修席有 Wi-Fi，個人筆電使用規則待確認。';
  nlpiMain.studyRoom = true;
  nlpiMain.closures = [...nlpiWeatherClosures, ...nlpi.closures, {
    from: '2026-07-21', until: '2026-07-21', reason: '國資圖總館因電力檢查休館',
    url: 'https://www.nlpi.edu.tw/Announcement/news?PageType=1&id=776f813d-013e-42b2-ba39-5ab36c8dc3e7',
  }];
  nlpiMain.calendarYear = nlpi.year;
  nlpiMain.checkDates = nlpi.adjustedDates;
  nlpiMain.sources.push(nlpiCalendar, ...nlpiArea.sources, ...nlpiQuietArea.sources);

  const peace = [...libraries.values()].find((library) => library.name === '臺中市和平區立圖書館');
  const peaceContact = contact.get('和平區立圖書館');
  if (peace) {
    peace.calendarYear = 2026;
    peace.calendarFrom = '2026-11-01';
    peace.checkDates = ['2026-11-28'];
    peace.studyRoom = true;
    peace.facilities = ['自習室', '無線上網', '哺乳室', '資訊檢索'];
    if (peaceContact) {
      peace.phone = peaceContact['市話'];
      peace.sources.push(cityDirectory);
    }
  }
  const auditById = new Map(ruleAudit?.libraries.map((record) => [record.id, record]));
  const checkedOn = ruleAudit && new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', dateStyle: 'short' })
    .format(new Date(ruleAudit.checkedAt));
  for (const library of libraries.values()) {
    const [reading] = library.areas;
    if (library.studyRoom === false && library.areas.length === 1 && reading.name === '一般閱覽座位' &&
        reading.equipment.laptop === undefined && library.facilities?.includes('筆電席位')) {
      reading.equipment.laptop = true;
      if (!reading.sources.includes(cityFacilities)) reading.sources.push(cityFacilities);
      library.sources.push(cityFacilities);
      const laptopNote = '市圖列有指定筆電席位。';
      library.accessNote = library.accessNote ? library.accessNote + ' ' + laptopNote : laptopNote;
    }
    if (library.areas.some((area) => area.kind === 'study' && area.access === 'walk-in' && area.sources.includes(cityRules))) {
      const seating = '市圖自習區原則上自由入座，每人一席。館方可在開館前發放號碼牌，離席逾一小時視同占位。';
      library.accessNote = library.accessNote ? library.accessNote + ' ' + seating : seating;
    }
    const audit = auditById.get(library.id);
    if (audit && checkedOn) {
      const result = audit.pages.some((page) => page.status === '已讀取') ? '已查館方公開網頁，缺漏欄位仍待核實'
        : audit.pages.length ? '館方網頁無法自動讀取或限制自動查核' : '缺少可自動查核的館方網址';
      library.reviewNote = checkedOn + ' ' + result;
      library.ruleLinks = audit.documents.map(({ url }) => url);
    }
  }
  const unique = new Map([...libraries.values()].map((library) => [library.id, {
    ...library, sources: [...new Set(library.sources)],
  }]));
  const snapshot: Snapshot = {
    _id: 'taichung', importedAt: new Date().toISOString(), issues,
    sourceCounts: { city: city.length, branches: branches.size, publicLibraries: publicLibraries.records.size },
    libraries: [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant')),
  };
  if (new Set(snapshot.libraries.map((library) => library.district)).size < 29 ||
      snapshot.libraries.some((library) => !library.address || !library.district) ||
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
