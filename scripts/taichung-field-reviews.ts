import { auditRows } from '../lib/field-audit.ts';
import type { AuditField, FieldReview } from '../lib/field-audit.ts';
import type { Library } from '../lib/study.ts';
import { cityHours, cityNotices, cityRules, citySite, nlpiCalendar, nlpiRules } from './taichung-sources.ts';

const taipingGuide = citySite + 'lib/content/index?Parser=1,123,375';
const taipingIntro = citySite + 'lib/Introduction/index?Parser=99,123,374';
const taipingWork = 'https://assess-public.taichung.gov.tw/ImportantWork/Detail/115DQ00007';
const taipingExhibit = citySite + 'lib/active/details?Parser=51,123,373,,,,26653';
const taipingEvent = citySite + 'lib/active/details?Parser=51,123,373,,,,26654';
const cityContact = citySite + 'pmail/index?Parser=99,3,87,28,44';
const dadunGuide = citySite + 'lib/content/index?Parser=1,105,195';
const nlpiFloors = 'https://www.nlpi.edu.tw/StaticPage/main-floors';
const hepingOpening = 'https://www.heping.taichung.gov.tw/4086049/post';
const hepingRules = 'https://www.heping.taichung.gov.tw/media/1324681/臺中市和平區立圖書館閱覽使用須知.pdf';

const checkedOn = '2026-11-14';
const priorityReviews = [
  {
    libraryId: 'tc-123', area: '', field: 'studyRoom', value: '有',
    note: '分館介紹列 60 席，空間導覽標明位於 B1。', sources: [taipingIntro, taipingGuide],
  },
  {
    libraryId: 'tc-123', area: 'B1 自習室', field: 'studyHours', value: null,
    note: '11 月 14 日 11:58 透過市圖官方 LINE 詢問 B1 施工期間是否開放、週二至週六與週日的固定時段及臨時調整日期。已收到非一對一諮詢時段的自動回覆，待館員答覆。11 月 7 日活動在 1 樓，11 月 10 日起的展覽只列整館時間。防水修繕預計 2027 年 2 月 1 日完工。',
    sources: [cityContact, taipingGuide, taipingEvent, taipingExhibit, taipingWork],
  },
  {
    libraryId: 'tc-123', area: 'B1 自習室', field: 'outlet', value: '未提供座位插座',
    note: '市圖自習區使用要點規定自習座位不供插座充電。', sources: [cityRules, taipingGuide],
  },
  {
    libraryId: 'tc-123', area: '一般閱覽座位', field: 'outlet', value: null,
    note: '館方名錄列有筆電席，但位置及可使用的座位插座待確認。', sources: [taipingIntro, taipingGuide],
  },
  {
    libraryId: 'tc-105', area: 'B棟2F自習室', field: 'studyHours', value: '週日、二、三、四、五、六 08:00–21:00',
    note: '閱覽須知單列 B 棟 2 樓自習室，週二至週日 08:00–21:00。',
    sources: [dadunGuide, citySite + 'form/Details?Parser=2,3,48,28,,,199'],
  },
  {
    libraryId: 'tc-105', area: 'B 棟 2 樓筆電優先使用區', field: 'outlet', value: null,
    note: '館方確認此區為筆電優先席，專用插座待確認。', sources: [dadunGuide],
  },
  {
    libraryId: 'tc-120', area: '一般閱覽座位', field: 'outlet', value: null,
    note: '舊到館紀錄可見閱覽桌插座。館方在 2026 年公告閱讀設備升級，現行位置及使用規則待確認。',
    sources: [citySite + 'latestevent/Details?Parser=22,3,38,27,,,1832', 'https://www.walkerland.com.tw/article/view/211808'],
  },
  {
    libraryId: 'tc-121', area: 'B1 自習室', field: 'studyHours', value: null,
    note: '復館後的館方介紹仍列自習室，公開時間是整館時段。專室時段待確認。',
    sources: [citySite + 'lib/Introduction/index?Parser=99,121,354', citySite + 'lib/content/index?Parser=1,121,355'],
  },
  {
    libraryId: 'tc-145', area: '自習室', field: 'studyHours', value: null,
    note: '復館後的分館介紹列 18 席自習座位。10 月 28 日更新的樓層導覽列 3 樓寧靜閱讀區，未標明獨立自習室。18 席的實際位置及適用時段待確認。',
    sources: [citySite + 'lib/Introduction/index?Parser=99,145,594', citySite + 'lib/content/index?Parser=1,145,595',
      'https://www.taichung.gov.tw/3398440/post'],
  },
  {
    libraryId: 'tc-128', area: '3 樓自習室', field: 'studyHours', value: null,
    note: '市府場地頁列 3 樓自習室，館方介紹列 52 席及整館時段。3 樓獨立時段待確認。',
    sources: [citySite + 'lib/Introduction/index?Parser=99,128,424',
      'https://eservices.taichung.gov.tw/LocationNew/Introduction/150/FacilityRental/4337e051-9c3a-4014-97a8-f9403c2d9525'],
  },
  {
    libraryId: 'tc-125', area: '4 樓自習室', field: 'studyHours', value: null,
    note: '現行樓層導覽確認 4 樓自習室。市府舊刊記載 08:00，現行官網列整館自 08:30 開放。4 樓目前是否有獨立時段仍待確認。',
    sources: [citySite + 'lib/content/index?Parser=1,125,395', citySite + 'lib/index?125',
      'https://www.taichung.gov.tw/media/270688/512291511171.pdf'],
  },
  {
    libraryId: 'tc-139', area: '2 樓自習室', field: 'studyHours', value: null,
    note: '現行樓層導覽及分館介紹列 2 樓自習室 84 席，館方公開時間為整館時段。專室時段待確認。',
    sources: [citySite + 'lib/content/index?Parser=1,139,535', citySite + 'lib/Introduction/index?Parser=99,139,534'],
  },
  {
    libraryId: 'tc-118', area: '4 樓自習室', field: 'studyHours',
    value: '週日 08:30–17:30；週二、三、四、五、六 08:30–21:00',
    note: '葫蘆墩文化中心單列 4 樓自修室，週二至週六 08:30–21:00，週日 08:30–17:30。',
    sources: ['https://www.huludun.taichung.gov.tw/content/index.asp?Parser=1,3,20'],
  },
  {
    libraryId: 'tc-134', area: '一般閱覽座位', field: 'outlet', value: null,
    note: '市府照片可辨認 3 樓靠窗筆電專用區。可供讀者使用的座位插座仍待確認。',
    sources: ['https://www.taichung.gov.tw/3229939/post', citySite + 'lib/content/index?Parser=1,134,485'],
  },
  {
    libraryId: 'tc-135', area: '一般閱覽座位', field: 'outlet', value: null,
    note: '到館照片可見 2 樓開架閱覽區靠窗長桌旁有插座。讀者可否在該座位充電仍待確認。',
    sources: [citySite + 'lib/Introduction/index?Parser=99,135,494', 'https://maps.app.goo.gl/ucB1Tv55J1fzQUh3A'],
  },
  {
    libraryId: 'ncl-a37723154b3ab4dc', area: '館內一般閱覽', field: 'outlet', value: null,
    note: '館方閱覽須知限在指定區域充電，禁止使用自備延長線。指定區域是否設有閱覽座位仍待確認。',
    sources: [hepingRules, hepingOpening],
  },
  {
    libraryId: 'tc-137', area: '館內筆電插座席', field: 'outlet', value: '可充電',
    note: '臺中市文化局出版的《文化臺中》及公共圖書館名錄列出館內 20 席筆電插座席。',
    sources: ['https://www.culture.taichung.gov.tw/media/919959/文化臺中no51_整本_細小_跨頁.pdf',
      'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000620'],
  },
  {
    libraryId: 'tc-141', area: '館內附插座閱覽座位', field: 'outlet', value: '可充電',
    note: '國資圖出版的復館訪查記載館內有 17 席附插座的閱覽座位。',
    sources: ['https://www-old.nlpi.edu.tw/JournalDetailC003313.aspx?Cond=26ca6952-6617-452f-97e6-36e7bf0bef8b',
      citySite + 'latestevent/Details?Parser=9,3,37,27,,,503'],
  },
  {
    libraryId: 'tc-148', area: '2 樓筆電優先區', field: 'outlet', value: '可充電',
    note: '館方導覽與到館照片可定位至 2 樓筆電優先區，座位有可用插座。',
    sources: [citySite + 'lib/content/index?Parser=1,148,709', 'https://flyblog.cc/situng-library/'],
  },
  {
    libraryId: 'tc-136', area: '', field: 'studyRoom', value: null,
    note: '舊館導覽及國家圖書館統計未列獨立自習室。原館預定 12 月 15 日恢復服務，改造後的配置仍待確認。',
    sources: [citySite + 'lib/content/index?Parser=1,136,505', 'https://libstat.ncl.edu.tw/libraryDataDetail/L5271000',
      citySite + 'latestevent/Details?Parser=22,3,38,27,,,1962'],
  },
  {
    libraryId: 'tc-149', area: '', field: 'studyRoom', value: null,
    note: '樓層導覽列 2 樓自修室，分館介紹列 0 席。兩處資料不足以確認專室目前對外開放。',
    sources: [citySite + 'lib/content/index?Parser=1,149,720', citySite + 'lib/Introduction/index?Parser=99,149,719'],
  },
  {
    libraryId: 'tc-147', area: '', field: 'studyRoom', value: null,
    note: '市府確認 11 月 13 日復館，舊導覽所列 3 樓自習室是否保留或開放仍待確認。',
    sources: ['https://www.taichung.gov.tw/3413311/post', citySite + 'lib/content/index?Parser=1,147,615'],
  },
  {
    libraryId: 'tc-140', area: '', field: 'studyRoom', value: null,
    note: '11 月 3 日起試營運開放 1 樓閱覽，11 月 17 日預定全面開放。復館後有無獨立自習室待確認。',
    sources: [citySite + 'latestevent/Details?Parser=9,3,41,27,,,1941', citySite + 'lib/content/index?Parser=1,140,545'],
  },
  {
    libraryId: 'tc-119', area: '', field: 'studyRoom', value: null,
    note: '館方公告原館施工休館，整修後有無獨立自習室待確認。',
    sources: [citySite + 'latestevent/Details?Parser=22,3,38,27,,,1631',
      citySite + 'lib/Introduction/index?Parser=99,119,334'],
  },
  {
    libraryId: 'ncl-3aa0574ed94d0f22', area: 'B1 自修閱覽室', field: 'studyHours',
    value: '週日、一 08:00–17:00；週二、三、四、五、六 08:00–21:00',
    note: '閱覽規定單列 B1，週二至週六 08:00–21:00，週日及週一 08:00–17:00，休館異動另依公告。',
    sources: [nlpiRules, nlpiFloors],
  },
  {
    libraryId: 'ncl-3aa0574ed94d0f22', area: 'B1 自修閱覽室', field: 'outlet', value: '未提供座位插座',
    note: '自修座位不供充電。2 至 5 樓的臨時充電站沒有座位。',
    sources: ['https://www.nlpi.edu.tw/StaticPage/laptop-charging', nlpiFloors],
  },
] satisfies Omit<FieldReview, 'checkedOn'>[];

const reviewedGaps = {
  studyHours: {
    'tc-120': 'B1 自習室', 'tc-122': '5 樓自習室', 'tc-107': 'B1 自習室',
    'tc-109': '3 樓自習室', 'tc-104': 'B1 自習室', 'tc-127': '3 樓自習室', 'tc-103': '3 樓自習室',
    'tc-149': '2 樓自修室（開放待確認）', 'tc-111': '自習室', 'tc-106': '4 樓自習室',
    'tc-132': '5 樓自習室', 'tc-133': '3 樓自習室', 'tc-147': '3 樓自習室',
    'ncl-a37723154b3ab4dc': '自習室',
  },
  outlet: {
    'tc-146': ['一般閱覽座位'],
    'tc-121': ['一般閱覽座位'], 'tc-136': ['一般閱覽座位'], 'tc-145': ['一般閱覽座位'],
    'tc-127': ['一般閱覽座位'], 'tc-149': ['2 樓自修室（開放待確認）'], 'tc-132': ['一般閱覽座位'],
    'tc-130': ['一般閱覽座位'], 'tc-131': ['一般閱覽座位'], 'tc-125': ['一般閱覽座位'],
    'tc-147': ['3 樓自習室', '一般閱覽座位'], 'tc-148': ['一般閱覽座位'],
    'ncl-a37723154b3ab4dc': ['自習室'], 'tc-140': ['一般閱覽座位'], 'tc-143': ['一般閱覽座位'],
    'tc-117-a': ['1 樓客家書區閱覽座位'], 'tc-117': ['1 樓一般閱覽區'], 'tc-119': ['一般閱覽座位'],
    'tc-139': ['一般閱覽座位'],
  },
} satisfies { studyHours: Record<string, string>; outlet: Record<string, string[]> };

const reviewedAreas: Partial<Record<AuditField, Map<string, string[]>>> = {
  studyHours: new Map(Object.entries(reviewedGaps.studyHours).map(([id, area]) => [id, [area]])),
  outlet: new Map(Object.entries(reviewedGaps.outlet)),
};

const municipalCalendar = {
  note: '臺中市立圖書館開放時間頁仍列 2026 年休館表，2027 年度表待館方公布。',
  sources: [cityHours, cityNotices],
};
const nationalCalendarReview = {
  note: '國資圖休館日已設 2027 年分頁，查核時分頁內沒有休館紀錄，年度表待館方公布。',
  sources: [nlpiCalendar],
};
const calendarSources: Record<string, Pick<FieldReview, 'note' | 'sources'>> = {
  'ncl-3aa0574ed94d0f22': nationalCalendarReview,
  'ncl-1ba74ad50e9db0a9': nationalCalendarReview,
  'ncl-a37723154b3ab4dc': {
    note: '區公所公告每週一及國定假日休館。2027 年逐日休館安排待館方公布。',
    sources: [hepingOpening],
  },
  'tc-119': {
    note: '原館自 2026 年 2 月 3 日起施工休館，館方預計 2027 年 3 月重新開放，確切日期及年度休館表待公布。',
    sources: [citySite + 'latestevent/Details?Parser=9,3,41,27,,,1628', cityHours],
  },
  'tc-149': {
    note: '市府預告 2027 年 1 月至 7 月進行閱讀環境優化工程。施工期間的服務異動及年度休館表待館方公告。',
    sources: ['https://assess-public.taichung.gov.tw/ImportantWork/ConstructionDetail/011527293', cityHours, cityNotices],
  },
  'tc-104': {
    note: '工程採購公告預估履約期間為 2026 年 12 月 10 日至 2027 年 7 月 7 日。施工期間的服務異動及年度休館表待館方公告。',
    sources: ['https://assess-public.taichung.gov.tw/ImportantWork/Detail/115DQ00003',
      'https://web.pcc.gov.tw/prkms/tender/common/noticeDate/redirectPublic?ds=20261110&fn=BDM-1-71327203.xml',
      cityHours, cityNotices],
  },
};

export function taichungFieldReviews(libraries: Library[], importedAt: string): FieldReview[] {
  const importDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', dateStyle: 'short' }).format(new Date(importedAt));
  const gaps = auditRows(libraries).flatMap<FieldReview>(({ library, libraryId, area, field, value, sources }) => {
    if (field === 'calendar2027') {
      const calendar = calendarSources[libraryId] ?? municipalCalendar;
      return [{ libraryId, area, field, value, checkedOn: value ? importDate : checkedOn, sources: calendar.sources,
        note: value ? '已從館方公開資料匯入 2027 年度休館表。' : calendar.note }];
    }
    if (value !== null || !reviewedAreas[field]?.get(libraryId)?.includes(area)) return [];
    const official = [...new Set([library.website, ...sources, ...library.sources]
      .filter((url): url is string => Boolean(url && /^https:\/\/(?:www\.library\.taichung\.gov\.tw\/lib\/|plisnet\.nlpi\.edu\.tw\/Frontend\/LibraryFamily\/|www\.heping\.taichung\.gov\.tw\/)/.test(url))))];
    const note = field === 'studyHours'
      ? '已對照館方資料與公共館名錄，現行專室時段仍待確認。'
      : '已對照館方資料與公共館名錄，可供讀者使用的座位插座仍待確認。';
    return [{ libraryId, area, field, value, note, sources: official, checkedOn }];
  });
  const explicit = priorityReviews.map((review) => ({ ...review, checkedOn }));
  return [...gaps, ...explicit];
}
