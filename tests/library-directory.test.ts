import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type { Library } from '../lib/study.ts';
import { withAnnouncedLibraries, withLibraryDetail, withTaichungDirectoryDetails, type LibraryDetail } from '../lib/library-details.ts';
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

test('國資圖中興分館依專室時段及全館 Wi-Fi 公告建檔', () => {
  const library = directory.libraries.find(({ id }) => id === 'plis-47d9eb53677ef9688a15')!;
  const detail = JSON.parse(readFileSync(new URL('library-details.json', root), 'utf8')).libraries[library.id];
  const enriched = withLibraryDetail(library, detail);
  const area = enriched.areas.find(({ kind }) => kind === 'study')!;
  assert.equal(area.name, '地下 1 樓自修室');
  assert.deepEqual(area.slots?.map(({ day, end }) => [day, end]), [
    [0, minutes('17:00')], ...[2, 3, 4, 5, 6].map((day) => [day, minutes('21:00')]),
  ]);
  assert.equal(area.equipment.wifi, true);
  assert.match(enriched.openingHours!, /兒童閱覽室 09:00–18:00/);
});

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
  assert(directory.libraries.every(({ coordinates }) => coordinates));
  const zhunan = directory.libraries.find(({ id }) => id === 'plis-1d5bc6bb745d6ead49e9')!;
  assert.deepEqual(zhunan.coordinates, { latitude: 24.6784234, longitude: 120.8719453 });
  const magang = directory.libraries.find(({ id }) => id === 'plis-838b908932f56e7b1d22')!;
  assert.deepEqual(magang.coordinates, { latitude: 26.159619, longitude: 119.919897 });
  const shanlong = directory.libraries.find(({ id }) => id === 'plis-cceeef12e0bfff59593f')!;
  assert.notDeepEqual(shanlong.coordinates, magang.coordinates);
  const pingzhen = directory.libraries.find(({ id }) => id === 'plis-07c47313a8f5b473d2bf')!;
  assert.deepEqual(pingzhen.coordinates, { latitude: 24.939778, longitude: 121.2176788 });
  const jinning = directory.libraries.find(({ id }) => id === 'plis-722d54fbc98c7dc13cc0')!;
  assert.deepEqual(jinning.coordinates, { latitude: 24.45112, longitude: 118.33422 });
  const alishan = directory.libraries.find(({ id }) => id === 'plis-e1773325972df453b6c4');
  assert(alishan?.website && alishan.sources.includes(alishan.website));
  const yancheng = directory.libraries.find(({ id }) => id === 'plis-4818cd57388587303882');
  assert.deepEqual(yancheng?.coordinates, { latitude: 22.626505, longitude: 120.286221 });
  assert(yancheng.sources.some((source) => new URL(source).hostname === 'www.tbkc.gov.tw'));
  const yongan = directory.libraries.find(({ id }) => id === 'plis-a2b6c71763cc26d5bc25')!;
  const temporary = withLibraryDetail(yongan, undefined);
  assert.equal(temporary.address, '高雄市永安區保寧里保安路16巷5號');
  assert.deepEqual(temporary.coordinates, { latitude: 22.8351230, longitude: 120.2360251 });
  assert.notDeepEqual(temporary.coordinates, yongan.coordinates);
  assert(temporary.sources.includes('https://data.gov.tw/dataset/177859'));
  const xinyi = directory.libraries.find(({ id }) => id === 'plis-d34887b8b49b91a79656')!;
  const aiguo = withLibraryDetail(xinyi, undefined);
  assert.equal(aiguo.address, '南投縣信義鄉愛國村愛國巷114號');
  assert.equal(aiguo.phone, '049-2791534');
  assert.deepEqual(aiguo.coordinates, { latitude: 23.7060107, longitude: 120.8332703 });
  assert.notDeepEqual(aiguo.coordinates, xinyi.coordinates);
});

test('傳真補錄保留來源，原始名錄明載無傳真的欄位持續有效', () => {
  const byName = (name: string) => directory.libraries.find((library) => library.name === name)!;
  const shilin = byName('臺北市立圖書館士林分館');
  assert.equal(shilin.fax, '02-28353985');
  assert(shilin.sources.includes('https://tpml.gov.taipei/cp.aspx?n=1F9AED300D314011'));
  assert.equal(byName('基隆市公共圖書館信義分館').fax, '02-24236174');
  assert.equal(byName('雲林縣元長鄉立圖書館').fax, '05-7888910');
  assert.equal(byName('新北市立圖書館三峽分館').fax, '無');
  assert.equal(byName('高雄市立圖書館鹽埕分館').fax, undefined);
});

test('臺中快照用同名同址名錄補缺，保留已有的開館時段', () => {
  const record = directory.libraries.find(({ name }) => name === '臺中市立圖書館大里大新分館')!;
  const branch = {
    ...record, id: 'taichung-daxin', name: '大里大新分館', address: '臺中市大里區大新街36之1號',
    fax: undefined, sources: ['https://www.library.taichung.gov.tw/'],
  };
  const result = withTaichungDirectoryDetails(branch, [record]);
  assert.equal(result.fax, '04-24965917');
  assert(result.sources.includes('https://data.gov.tw/dataset/99567'));
  const relocated = { ...branch, address: '臺中市大里區大新街38號' };
  assert.equal(withTaichungDirectoryDetails(relocated, [record]), relocated);
  assert.equal(withTaichungDirectoryDetails(branch, [record, record]), branch);
  const enrichedRecord = { ...record, openingHours: '週二至週日 09:00–17:00' };
  assert.equal(withTaichungDirectoryDetails(branch, [enrichedRecord]).openingHours, enrichedRecord.openingHours);
  const scheduled = { ...branch, schedule: [{ day: 2, start: minutes('09:00'), end: minutes('17:00') }] };
  assert.equal(withTaichungDirectoryDetails(scheduled, [enrichedRecord]).openingHours, undefined);
  const missingFacilities = { ...scheduled, fax: result.fax, facilities: [] };
  const facilityRecord = { ...enrichedRecord, facilities: ['兒童閱覽區'] };
  assert.deepEqual(withTaichungDirectoryDetails(missingFacilities, [facilityRecord]).facilities, ['兒童閱覽區']);
  const existingFacilities = { ...missingFacilities, facilities: ['無障礙電梯'] };
  assert.equal(withTaichungDirectoryDetails(existingFacilities, [facilityRecord]), existingFacilities);
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
  const banqiao = libraries.find(({ id }) => id === 'plis-851a10bc58bf5f5c6fcb')!;
  assert.equal(banqiao.studyRoom, false);
  assert.equal(banqiao.areas.length, 0);
  assert.match(banqiao.openingHours!, /臨時據點/);
  const gongliao = libraries.find(({ id }) => id === 'plis-5700fc946f2296c185af')!;
  assert(gongliao.closures.some(({ from, until }) => from === '2026-08-27' && until === '2027-01-06'));
  assert.equal(scheduled.length, 145);
  const yunlin = libraries.find(({ id }) => id === 'plis-3fb94b86e4de966ba65a')!;
  assert.equal(yunlin.areas[0].access, 'walk-in');
  assert.equal(yunlin.areas[0].equipment.outlet, true);
  for (const id of ['plis-942c78ab15d304c768e8', 'plis-0e472236b6cd90d7217c']) {
    const branch = libraries.find((library) => library.id === id)!;
    assert.equal(branch.studyRoom, true);
    assert.equal(branch.areas[0].slots, null);
  }
  const baoshan = libraries.find(({ id }) => id === 'plis-d31d9ccdab3c7bcf9ff3')!;
  assert.equal(baoshan.address, '新竹縣寶山鄉雙園路二段283號');
  assert.deepEqual(baoshan.coordinates, { latitude: 24.7665, longitude: 120.993 });
  assert.equal(baoshan.studyRoom, undefined);
  assert.equal(baoshan.areas.length, 0);
  const jianshi = libraries.find(({ id }) => id === 'plis-0a0cb9e669998c949020')!;
  assert.equal(jianshi.address, '新竹縣尖石鄉嘉樂村2鄰64號');
  assert(jianshi.facilities?.includes('原住民館藏室'));
  const houbi = libraries.find(({ id }) => id === 'plis-a3aa908413cf852b7708')!;
  assert.equal(houbi.studyRoom, true);
  assert.equal(houbi.areas[0].name, '自修區');
  const zhonglu = libraries.find(({ id }) => id === 'plis-094ed6f57775956545a2')!;
  assert.equal(zhonglu.areas[0].seats, 85);
  assert.equal(zhonglu.areas[0].equipment.wifi, true);
  assert.equal(zhonglu.areas[0].equipment.laptop, true);
  assert.equal(zhonglu.areas[0].access, 'walk-in');
  const nankan = libraries.find(({ id }) => id === 'plis-369d482f8c183f32943f')!;
  assert.equal(nankan.areas[0].seats, 44);
  assert.equal(nankan.areas[0].access, 'walk-in');
  const changhuaCity = libraries.find(({ id }) => id === 'plis-d4bafe538b622515b304')!;
  assert.deepEqual(changhuaCity.areas[0].slots?.map(({ day }) => day).sort(), [0, 1, 3, 4, 5, 6]);
  const yuanlin = libraries.find(({ id }) => id === 'plis-016c903b9ad9d1b886d6')!;
  assert.equal(yuanlin.areas[0].name, '地下 1 樓自修室');
  assert.equal(yuanlin.areas[0].access, 'walk-in');
  assert.deepEqual(yuanlin.areas[0].equipment, { outlet: false, laptop: false });
  for (const id of ['plis-12a529595d2715dda629', yuanlin.id]) {
    assert(libraries.find((library) => library.id === id)?.closures.some(({ from }) => from === '2026-11-28'));
  }
  const luodong = libraries.find(({ id }) => id === 'plis-c45011eb98a75a2b9c10')!;
  assert.equal(luodong.areas[0].name, '南豪館 2 樓自修室');
  assert.equal(luodong.areas[0].seats, 100);
  assert.equal(luodong.areas[0].access, 'walk-in');
  assert.equal(luodong.areas[0].slots?.length, 6);
  const jiaoxi = libraries.find(({ id }) => id === 'plis-5c096392579b74bd371a')!;
  assert.deepEqual(jiaoxi.areas[0].slots?.find(({ day }) => day === 0),
    { day: 0, start: minutes('09:00'), end: minutes('18:00') });
  const yilanCity = libraries.find(({ id }) => id === 'plis-9f7edd85cf79ea635049')!;
  assert.deepEqual(yilanCity.areas[0].equipment, { laptop: true, outlet: true });
  const zhuangwei = libraries.find(({ id }) => id === 'plis-0f495639312343ec173e')!;
  assert.match(zhuangwei.openingHours!, /08:30–17:00/);
  assert(zhuangwei.facilities?.includes('電梯') && zhuangwei.facilities.includes('親子共讀區'));
  const yuanshan = libraries.find(({ id }) => id === 'plis-44d1777aefba3d40891b')!;
  assert(yuanshan.facilities?.includes('地下 1 樓民眾閱覽室'));
  const qionglin = libraries.find(({ id }) => id === 'plis-cf8f59d429a9ca2188f7')!;
  assert.equal(qionglin.areas[0].seats, 25);
  assert.equal(qionglin.areas[0].access, 'walk-in');
  const xinying = libraries.find(({ name }) => name === '臺南市新營文化中心圖書館')!;
  assert.equal(xinying.areas[0].name, '6 樓自修室');
  assert.deepEqual(xinying.areas[0].slots?.find(({ day }) => day === 6),
    { day: 6, start: minutes('07:00'), end: minutes('20:30') });
  const liuying = libraries.find(({ name }) => name === '臺南市柳營區圖書館')!;
  assert.equal(liuying.studyRoom, true);
  assert.equal(liuying.areas[0].slots?.length, 6);
  const xinwu = libraries.find(({ name }) => name === '桃園市立圖書館新屋分館')!;
  assert.equal(xinwu.studyRoom, false);
  assert.equal(xinwu.areas.length, 0);
  assert.match(xinwu.openingHours!, /臨時營運所/);
  assert.equal(libraries.find(({ name }) => name === '桃園市立圖書館楊梅分館')!.areas[0].seats, 160);
  assert.equal(libraries.find(({ name }) => name === '桃園市立圖書館大崗分館')!.areas[0].seats, 90);
  const longgang = libraries.find(({ name }) => name === '桃園市立圖書館龍岡分館')!;
  assert.equal(longgang.areas[0].seats, 265);
  assert.equal(longgang.areas[0].slots?.find(({ day }) => day === 1)?.end, minutes('17:00'));
  const dongshi = libraries.find(({ name }) => name === '桃園市立圖書館東勢分館')!;
  assert.equal(dongshi.studyRoom, true);
  assert.equal(dongshi.areas[0].slots?.find(({ day }) => day === 2)?.end, minutes('21:00'));
  const kangzhuang = libraries.find(({ name }) => name === '桃園市立圖書館康莊分館')!;
  assert.equal(kangzhuang.areas[0].seats, 24);
  assert(kangzhuang.areas[0].slots?.every(({ end }) => end === minutes('17:00')));
  const dazhu = libraries.find(({ name }) => name === '桃園市立圖書館大竹分館')!;
  assert.equal(dazhu.areas[0].regionalCard, 'taoyuan');
  assert.equal(dazhu.areas[0].seats, 50);
  assert.equal(dazhu.areas[0].slots?.find(({ day }) => day === 1)?.end, minutes('17:00'));
  const taoyuanMain = libraries.find(({ name }) => name === '桃園市立圖書館總館')!;
  assert.equal(taoyuanMain.areas[0].equipment.laptop, false);
  const beipu = libraries.find(({ id }) => id === 'plis-12cb176cd411e9d41770')!;
  assert.deepEqual(beipu.areas[0].slots?.find(({ day }) => day === 0),
    { day: 0, start: minutes('08:00'), end: minutes('17:00') });
  const zhudong = libraries.find(({ id }) => id === 'plis-24ed27c19953ccb5f0c4')!;
  assert.equal(zhudong.areas[0].slots?.find(({ day }) => day === 2)?.start, minutes('08:30'));
  const xinpu = libraries.find(({ id }) => id === 'plis-2bbbdcd83068ffcf8f4f')!;
  assert.equal(xinpu.areas[0].seats, 54);
  const supplemented = withAnnouncedLibraries(directory.libraries);
  const puding = supplemented.find(({ id }) => id === 'local-taoyuan-puding')!;
  assert.equal(puding.areas[0].seats, 93);
  assert.equal(puding.phone, '03-3072254');
  assert.equal(puding.address, '桃園市大溪區埔仁路555號');
  assert.deepEqual(puding.areas[0].slots?.map(({ end }) => end), [1020, 1020, 1260, 1260, 1260, 1260, 1260]);
  assert.equal(puding.closures[0].from, '2026-11-28');
  const sanhe = libraries.find(({ id }) => id === 'plis-b9b43f111c155ee7f7b1')!;
  assert.equal(sanhe.closures.find(({ from }) => from === '2026-06-29')?.url,
    'https://www.typl.gov.tw/zh-tw/News/Content/3120');
  const main = supplemented.find(({ name }) => name === '新竹縣立總圖書館')!;
  assert.equal(main.address, '新竹縣竹北市自強三路155號');
  assert.equal(main.phone, '03-658-8139');
  assert.equal(main.areas[0].name, '地下 1 樓自修室');
  assert.equal(main.areas[0].slots, null);
  assert.equal(main.closures[0].until, '2026-12-17');
  assert(supplemented.some(({ name, openingHours }) => name === '竹北星際圖書館' && openingHours?.includes('24:00')));
  const stellar = supplemented.find(({ name }) => name === '竹北星際圖書館')!;
  assert.deepEqual(stellar.coordinates, { latitude: 24.8396572, longitude: 121.0036135 });
  assert.equal(supplemented.find(({ id }) => id === 'local-hsinchu-city-nanda')?.areas[0].seats, 100);
  const fude = libraries.find(({ id }) => id === 'plis-e2c2e5a82e7e92aa1179')!;
  assert.match(fude.name, /福德分館/);
  assert.match(fude.openingHours!, /09:00–20:30/);
  assert.equal(withAnnouncedLibraries([...directory.libraries, { ...main, id: 'plis-from-directory' }])
    .filter(({ address }) => address === main.address).length, 1);
  const oldHsinchuCounty = libraries.find(({ id }) => id === 'plis-e94c48945a092b5818d8')!;
  assert.match(oldHsinchuCounty.accessNote!, /各樓層已恢復開放/);
  assert.equal(oldHsinchuCounty.areas[0].access, 'walk-in');
  assert.equal(oldHsinchuCounty.areas[0].seats, 141);
  assert(oldHsinchuCounty.closures.some(({ from }) => from === '2026-11-28'));
  const kinmenUpdate = libraries.find(({ id }) => id === 'plis-e3c1d8e816d9e6061a7d')!;
  assert.match(kinmenUpdate.accessNote!, /南棟持續服務/);
  const miaoli = libraries.find(({ id }) => id === 'plis-703e62be51f0cd3f7e93')!;
  assert.match(miaoli.areas[0].entryNote!, /08:00–20:00/);
  const toufen = libraries.find(({ id }) => id === 'plis-8258ecedb33967785152')!;
  assert.equal(toufen.areas[0].slots?.find(({ day }) => day === 6)?.end, minutes('17:00'));
  const magang = libraries.find(({ id }) => id === 'plis-838b908932f56e7b1d22')!;
  assert.equal(magang.areas[0].name, '1 樓自修區');
  assert.equal(magang.areas[0].slots, null);
  assert.match(magang.areas[0].entryNote!, /啟用時公告可容納 20 人/);
  assert.equal(magang.closures[0].until, '2026-02-22');
  const penghu = libraries.find(({ id }) => id === 'plis-f3080ccd8c34dad70222')!;
  assert.equal(penghu.areas[0].slots?.length, 7);
  assert.equal(penghu.areas[0].equipment.laptop, true);
  assert.equal(penghu.areas[0].equipment.wifi, true);
  assert.equal(penghu.areas[0].access, 'walk-in');
  assert(penghu.areas[0].closures?.some(({ from }) => from === '2026-11-24'));
  assert(penghu.areas[0].closures?.some(({ from }) => from === '2027-02-23'));
  assert(!penghu.closures.some(({ from }) => from === '2026-11-24'));
  assert(penghu.closures.some(({ from, until }) => from === '2026-04-04' && until === '2026-04-05'));
  const baisha = libraries.find(({ id }) => id === 'plis-7d5f6b4a8aae37204a84')!;
  assert.equal(baisha.studyRoom, true);
  assert.equal(baisha.areas[0].slots, null);
  const kinmen = libraries.find(({ id }) => id === 'plis-e3c1d8e816d9e6061a7d')!;
  assert.equal(kinmen.areas[0].slots?.length, 6);
  assert(!kinmen.areas[0].slots?.some(({ day }) => day === 1));
  const jinsha = libraries.find(({ id }) => id === 'plis-387900bcde6ccbe06570')!;
  assert.equal(jinsha.areas[0].name, '3 樓閱讀自習室');
  assert(jinsha.facilities?.includes('讀者劇場'));
  assert.equal(libraries.filter(({ city, facilities }) => city === '金門縣' && facilities?.length).length, 5);
  assert.equal(libraries.find(({ id }) => id === 'plis-ca5bd98a9d6dcfd1159b')?.areas[0].name, '1 樓自修室');
  for (const id of ['plis-cbce401033404caad835', 'plis-722d54fbc98c7dc13cc0']) {
    const library = libraries.find((record) => record.id === id)!;
    assert.equal(library.areas[0].kind, 'reading');
    assert.equal(library.studyRoom, id === 'plis-722d54fbc98c7dc13cc0' ? false : undefined);
  }
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
  assert.equal(taitung.areas[0].access, 'card');
  assert.equal(taitung.areas[0].regionalCard, 'taitung');
  const guanshan = libraries.find(({ id }) => id === 'plis-c9c0fe185180d1def859')!;
  assert.equal(guanshan.studyRoom, true);
  assert.equal(guanshan.areas[0].name, '2 樓自修室');
  const jinfeng = libraries.find(({ id }) => id === 'plis-41bce5bf027121bcb9e9')!;
  assert.equal(jinfeng.areas[0].equipment.laptop, true);
  const chenggong = libraries.find(({ id }) => id === 'plis-3dc026b916c043fe287e')!;
  assert.match(chenggong.openingHours!, /整修期間閱覽區週二至週日 08:00–17:00/);
  assert.deepEqual(chenggong.areas[0].slots?.[0], { day: 0, start: minutes('08:00'), end: minutes('17:00') });
  const huangbin = libraries.find(({ id }) => id === 'plis-eb5cc227330385ea9b00')!;
  const result = evaluate(huangbin, undefined, {
    date: '2026-11-15', start: minutes('14:00'), duration: 120, kind: 'study', card: false, registration: false, required: [],
  });
  assert.equal(result.status, 'no');
  assert.equal(result.closure?.from, '2026-03-02');
  const culture = libraries.find(({ id }) => id === 'plis-645a77676fc64f962dcf')!;
  assert(culture.closures.some(({ from }) => from === '2026-04-11'));
  assert.match(culture.accessNote!, /湖內里活動中心.*嘉義大學林森校區/);
  const shixian = libraries.find(({ id }) => id === 'plis-34ea4e3647b8191ffef9')!;
  assert.deepEqual(shixian.areas[0].slots?.find(({ day }) => day === 6),
    { day: 6, start: minutes('09:00'), end: minutes('20:00') });
  assert(shixian.closures.some(({ from }) => from === '2026-11-28'));
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
  const yongkang = get('臺南市永康區圖書館');
  assert.equal(yongkang.areas[0].name, '5 樓自修室');
  assert.match(yongkang.accessNote!, /A 棟 1 樓臨時櫃檯/);
  assert.equal(evaluate(yongkang, yongkang.areas[0], query).closure?.until, '2026-11-29');
  assert.equal(evaluate(yongkang, yongkang.areas[0], { ...query, date: '2027-01-25' }).closure?.until, '2027-01-25');
  assert.equal(evaluate(yongkang, yongkang.areas[0], { ...query, date: '2027-01-26' }).status, 'unknown');
});

test('高雄以館方自修室欄決定席次與時段，總館和分館依公告區別假日', () => {
  const { libraries: details } = JSON.parse(readFileSync(new URL('library-details.json', root), 'utf8')) as {
    libraries: Record<string, LibraryDetail>;
  };
  const libraries = directory.libraries.filter(({ city }) => city === '高雄市')
    .map((library) => withLibraryDetail(library, details[library.id]));
  assert.equal(libraries.filter(({ studyRoom }) => studyRoom === true).length, 29);
  assert.equal(libraries.filter(({ studyRoom }) => studyRoom === false).length, 34);
  assert.equal(libraries.filter((library) => coversCalendarYear(library, 2026)).length, 61);
  const cijin = libraries.find(({ name }) => name === '高雄市立圖書館旗津分館')!;
  assert.equal(cijin.areas[0].seats, 38);
  assert.equal(cijin.areas[0].access, 'walk-in');
  assert.deepEqual(cijin.areas[0].equipment, { laptop: false, wifi: false, outlet: false });
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
  assert.equal(area.equipment.wifi, true);
  assert.equal(area.equipment.outlet, undefined);
  assert.equal(get('臺北市立圖書館葫蘆堵分館').areas[0].equipment.wifi, undefined);
  const qingjiang = get('臺北市立圖書館清江分館');
  assert.equal(qingjiang.studyRoom, true);
  assert.equal(qingjiang.areas[0].seats, 96);
  assert.equal(qingjiang.areas[0].access, 'walk-in');
  assert.equal(qingjiang.areas[0].equipment.wifi, true);
  assert.deepEqual(qingjiang.areas[0].slots?.[1], { day: 1, start: minutes('09:00'), end: minutes('17:00') });
  const donghu = get('臺北市立圖書館東湖分館');
  assert.equal(donghu.areas[0].seats, 216);
  assert(donghu.closures.some(({ from, until }) => from === '2026-11-16' && until === from));
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
  const fuying = get('新北市立圖書館新莊福營分館').areas[0];
  assert.equal(fuying.seats, 117);
  assert.equal(fuying.equipment.outlet, true);
  assert.match(fuying.entryNote!, /28 席/);
  assert.equal(get('新北市立圖書館中和分館').studyRoom, false);
  const taishan = get('新北市立圖書館泰山分館');
  const request = { date: '2026-12-10', start: minutes('14:00'), duration: 60,
    kind: 'study' as const, card: false, registration: false, required: [] };
  assert.equal(taishan.areas[0].seats, 170);
  assert.equal(evaluate(taishan, taishan.areas[0], request).closure?.until, '2026-12-10');
  assert.equal(evaluate(taishan, undefined, { ...request, kind: 'reading' }).closure, undefined);
  assert.equal(evaluate(taishan, taishan.areas[0], { ...request, date: '2026-12-11' }).closure, undefined);
  const linkou = get('新北市立圖書館林口分館');
  assert.equal(evaluate(linkou, linkou.areas[0], { ...request, date: '2026-11-14' }).closure?.until, '2026-11-14');
  assert.equal(evaluate(linkou, linkou.areas[0], { ...request, date: '2026-11-15' }).closure, undefined);
  assert.equal(evaluate(linkou, linkou.areas[0], { ...request, date: '2026-11-27' }).closure?.reason, '圖書盤點休館');
  const xindian = get('新北市立圖書館新店分館');
  const chengzhou = get('新北市立圖書館五股成州圖書閱覽室').areas.find(({ kind }) => kind === 'study')!;
  assert.equal(chengzhou.seats, 24);
  assert.match(chengzhou.entryNote!, /簡介另列 38 席/);
  const yongping = get('新北市立圖書館蘆洲永平分館');
  assert.equal(yongping.areas.find(({ kind }) => kind === 'study')?.equipment.wifi, true);
  assert.equal(yongping.areas.find(({ kind }) => kind === 'study')?.seats, undefined);
  assert.equal(yongping.areas.find(({ kind }) => kind === 'reading')?.seats, 94);
  assert.equal(yongping.areas.find(({ kind }) => kind === 'reading')?.equipment.outlet, true);
  const baoxing = get('新北市立圖書館新店寶興圖書閱覽室');
  const xizhi = get('新北市立圖書館汐止分館');
  const jiangbei = get('新北市立圖書館汐止江北分館');
  assert.equal(evaluate(xizhi, undefined, { ...request, date: '2026-10-30' }).closure?.reason, '館方行事曆公告休館');
  assert.equal(evaluate(jiangbei, undefined, { ...request, date: '2026-10-30' }).closure, undefined);
  assert.equal(evaluate(jiangbei, undefined, { ...request, date: '2026-10-23' }).closure?.reason, '館方行事曆公告休館');
  const zutian = get('新北市立圖書館土城祖田圖書閱覽室');
  const sanzhi = get('新北市立圖書館三芝分館');
  assert.match(evaluate(sanzhi, undefined, { ...request, date: '2026-11-02' }).closure!.reason, /還書及預約取書/);
  assert.equal(evaluate(sanzhi, undefined, { ...request, date: '2026-11-03' }).closure, undefined);
  const sanchongSouth = get('新北市立圖書館三重南區分館');
  assert.match(evaluate(sanchongSouth, sanchongSouth.areas[0], { ...request, date: '2026-10-28' }).closure!.reason, /防水改善/);
  assert.equal(evaluate(sanchongSouth, sanchongSouth.areas[0], { ...request, date: '2026-10-30' }).closure, undefined);
  assert.equal(evaluate(zutian, undefined, { ...request, date: '2026-10-29' }).closure?.reason, '空調設備汰換施工休館');
  assert.equal(evaluate(xindian, undefined, { ...request, date: '2026-10-29' }).closure?.reason, '圖書盤點休館');
  assert.equal(evaluate(xindian, undefined, { ...request, date: '2026-10-30' }).closure?.reason, '圖書盤點休館');
  assert.equal(evaluate(baoxing, undefined, { ...request, date: '2026-10-27' }).closure?.reason, '圖書盤點休館');
  assert.equal(evaluate(xindian, undefined, { ...request, date: '2026-10-27' }).closure, undefined);
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
  const baoshan = libraries.find(({ id }) => id === 'plis-d31d9ccdab3c7bcf9ff3')!;
  assert.equal(evaluate(baoshan, undefined, { ...taipeiQuery, date: '2026-11-28' }).closure?.reason, '選舉日休館');
  assert(baoshan.checkDates?.includes('2026-11-27'));
  assert.equal(libraries.filter(({ city, closures }) => city === '新竹市' &&
    closures.some(({ from }) => from === '2026-11-28')).length, 9);
  assert.equal(evaluate(taipei, taipei.areas[0], taipeiQuery).status, 'no');
  assert.equal(evaluate(taipei, taipei.areas[0], { ...taipeiQuery, date: '2027-02-10' }).status, 'yes');
  const newTaipei = libraries.find(({ name }) => name === '新北市立圖書館三峽分館')!;
  assert.equal(evaluate(newTaipei, newTaipei.areas[0], { ...taipeiQuery, date: '2026-11-28' }).status, 'no');
  assert.equal(evaluate(newTaipei, newTaipei.areas[0], { ...taipeiQuery, date: '2026-06-25' }).status, 'unknown');
  for (const date of ['2026-02-21', '2026-06-25']) {
    const beforeClosing = { ...taipeiQuery, date, start: minutes('16:00'), duration: 60 };
    assert.equal(evaluate(newTaipei, newTaipei.areas[0], beforeClosing).closure, undefined);
    assert.equal(evaluate(newTaipei, newTaipei.areas[0], { ...beforeClosing, duration: 61 }).closure?.time?.start, minutes('17:00'));
  }
  assert.equal(coversCalendarYear(newTaipei, 2027), false);
  const tamsui = libraries.find(({ id }) => id === 'plis-2f3bedb51e2b23a23a59')!;
  const gongliao = libraries.find(({ id }) => id === 'plis-5700fc946f2296c185af')!;
  const maySunday = { ...taipeiQuery, date: '2026-05-10', start: minutes('20:30'), duration: 30 };
  assert.equal(evaluate(tamsui, undefined, maySunday).closure, undefined);
  assert.equal(evaluate(tamsui, undefined, { ...maySunday, duration: 31 }).closure?.time?.start, minutes('21:00'));
  assert.equal(evaluate(gongliao, undefined, maySunday).closure?.time?.start, minutes('17:00'));
  const electionEve = { ...taipeiQuery, date: '2026-11-27', start: minutes('11:00'), duration: 60 };
  const xindian = libraries.find(({ id }) => id === 'plis-b9568520f14810d9931a')!;
  assert.equal(evaluate(xindian, xindian.areas[0], electionEve).closure, undefined);
  assert.equal(evaluate(xindian, xindian.areas[0], { ...electionEve, duration: 61 }).closure?.time?.start, minutes('12:00'));
  const luzhou = libraries.find(({ id }) => id === 'plis-4b5e39e13cd44319599f')!;
  assert.equal(luzhou.closures.find(({ from }) => from === '2026-11-27')?.time?.start, minutes('13:00'));
  const dongsheng = libraries.find(({ id }) => id === 'plis-f5672c9a38fabba9eabb')!;
  assert.match(dongsheng.closures.find(({ from }) => from === '2026-12-01')!.reason, /中洲街 5-2 號/);
  const ntl = libraries.find(({ name }) => name === '國立臺灣圖書館')!;
  const ntlStudy = ntl.areas.find(({ kind }) => kind === 'study')!;
  assert.equal(evaluate(ntl, ntlStudy, { ...taipeiQuery, date: '2026-02-20' }).status, 'unknown');
  const deviceSeats = ntl.areas.find(({ name }) => name === '3 樓行動裝置座位區')!;
  assert.equal(deviceSeats.seats, 50);
  const deviceQuery = { ...taipeiQuery, date: '2026-11-19', kind: 'reading' as const, start: minutes('08:00'),
    duration: 60, regionalCards: ['nationalTaiwan' as const], registration: true, required: ['outlet' as const] };
  assert.equal(evaluate(ntl, deviceSeats, deviceQuery).status, 'yes');
  assert.equal(evaluate(ntl, deviceSeats, { ...deviceQuery, date: '2026-11-16' }).status, 'no');
  assert.equal(coversCalendarYear(libraries.find(({ name }) => name === '新北市烏來區立圖書館')!, 2026), false);
  const liujia = libraries.find(({ name }) => name === '臺南市六甲區圖書館')!;
  const anping = libraries.find(({ name }) => name === '臺南市安平區圖書館')!;
  assert(coversCalendarYear(liujia, 2026) && coversCalendarYear(anping, 2026));
  assert(liujia.closures.some(({ from }) => from === '2026-01-31'));
  assert(anping.closures.some(({ from, reason }) => from === '2026-12-18' && reason === '清潔日休館'));
  assert(!liujia.closures.some(({ from }) => from === '2026-12-18'));
  const zhongxi = libraries.find(({ id }) => id === 'plis-898454ce1e74dac77083')!;
  assert.equal(coversCalendarYear(zhongxi, 2026), true);
  assert(zhongxi.checkDates?.includes('2026-02-28'));
  const yanshui = libraries.find(({ id }) => id === 'plis-66fa0a939c2eddc2cbeb')!;
  assert.equal(evaluate(yanshui, undefined, { ...taipeiQuery, date: '2026-11-20' }).closure?.until, '2026-11-20');
  assert.equal(evaluate(yanshui, undefined, { ...taipeiQuery, date: '2026-11-21' }).closure, undefined);
  const dayuan = libraries.find(({ name }) => name === '桃園市立圖書館大園分館')!;
  assert.equal(dayuan.areas[0].seats, 147);
  const taoyuanQuery = { ...taipeiQuery, regionalCards: ['taoyuan' as const] };
  assert.equal(evaluate(dayuan, dayuan.areas[0], { ...taoyuanQuery, date: '2026-10-24' }).closure?.reason, '薔琵颱風休館');
  assert.equal(evaluate(dayuan, dayuan.areas[0], { ...taoyuanQuery, date: '2026-11-26' }).status, 'no');
  assert.equal(evaluate(dayuan, dayuan.areas[0], { ...taoyuanQuery, date: '2026-11-27' }).status, 'yes');
  const qiding = libraries.find(({ name }) => name === '桃園市立圖書館崎頂分館')!;
  assert.match(evaluate(qiding, qiding.areas[0], { ...taoyuanQuery, date: '2026-11-27' }).closure!.reason, /搬遷/);
  const keelung = libraries.find(({ name }) => name === '基隆市公共圖書館總館')!;
  assert.equal(keelung.areas[0].regionalCard, 'keelung');
  assert.equal(keelung.areas[0].seats, 109);
  assert.equal(evaluate(keelung, keelung.areas[0], { ...taipeiQuery, date: '2026-02-21' }).status, 'no');
  const renai = libraries.find(({ id }) => id === 'plis-d5b8a42994a660f05102')!;
  const outage = { ...taipeiQuery, date: '2026-05-23' };
  assert.equal(evaluate(renai, undefined, outage).closure?.reason, '仁愛分館停電休館');
  assert.equal(evaluate(keelung, keelung.areas[0], outage).closure, undefined);
});
