import type { Area, Library } from '../lib/study.ts';
import { parseSlots } from './taichung-sources.ts';

type Review = { sources: string[]; note: string; areas?: Area[] };

const thuRoom = 'https://lis.thu.edu.tw/web/page/page.php?lang=zh_tw&scid=19&sid=28';
const thuRules = 'https://lis.thu.edu.tw/web/laws/detail.php?cid=2&id=9&lang=zh_tw';
const thuHours = 'https://lis.thu.edu.tw/web/calendar/page.php?lang=zh_tw&scid=23&sid=39';
const thuTerm = { from: '2026-09-14', until: '2027-01-17' };
const thuSlots = parseSlots('週一至週五8:00至23:00、週六至週日9:00至21:00');
const fcuRules = 'https://web.lib.fcu.edu.tw/library/about_library/rules/rule_study_room.html';
const fcuMembers = 'https://web.lib.fcu.edu.tw/library/services/other/member_application.html';
const fcuHours = 'https://web.lib.fcu.edu.tw/library/about_library/library_hours.html';
const ncutHours = 'https://library.ncut.edu.tw/p/412-1013-810.php?Lang=zh-tw';
const ncutAccess = 'https://library.ncut.edu.tw/p/405-1013-4672,c1066.php?Lang=zh-tw';
const nutcHours = 'https://elib.nutc.edu.tw/p/404-1115-120628.php';
const nutcAccess = 'https://elib.nutc.edu.tw/var/file/115/1115/img/3508/584721319.pdf';
const hkRoom = 'https://lib.hk.edu.tw/空間設備/自修閱覽室/';
const hkSpaces = 'https://lib.hk.edu.tw/空間設備/';
const tcfshRules = 'https://tcfsh.tc.edu.tw/var/file/76/1076/img/2071/253921390.pdf';
const tcgsRules = 'https://itcgs.tcgs.tc.edu.tw/library?cid=1648';
const daliRules = 'https://public.dali.tc.edu.tw/rules/doc/2025/pdf/350-01.pdf';
const ctasRoom = 'https://bak.ctas.tc.edu.tw/ischool/publish_page/342/?cid=9268';
const ctasRules = 'https://bak.ctas.tc.edu.tw/ischool/publish_page/277/?cid=6978';
const fyvsRoom = 'https://fyvs.tc.edu.tw/p/404-1085-354448.php';
const tcavsRules = 'https://libnew.tcavs.tc.edu.tw/docs/國立興大附農社區共讀站使用實施要點.pdf';
const cyutSpace = 'https://pmlis.cyut.edu.tw/libx/iSpace_read.php?LANG=ZH';
const cyutHours = 'https://pmlis.cyut.edu.tw/time.php?LANG=ZH';
const asiaHours = 'https://library.asia.edu.tw/p/404-1004-652.php?Lang=zh-tw';
const asiaSpace = 'https://library.asia.edu.tw/p/404-1004-3414.php?Lang=zh-tw';
const asiaAccess = 'https://library.asia.edu.tw/var/file/4/1004/img/39/467063415.pdf';
const asiaReading = 'https://library.asia.edu.tw/var/file/4/1004/img/39/496740911.pdf';
const slvsRules = 'https://slvs.tc.edu.tw/p/412-1082-10551.php?Lang=zh-tw';
const syshRoom = 'https://sysh.tc.edu.tw/p/404-1064-445246.php';
const ntusRules = 'https://lis.ntus.edu.tw/index.php?code=list&ids=35';
const ntusHours = 'https://lis.ntus.edu.tw/index.php?code=list&ids=7';
const cathay = 'https://www.cathay-cultural.org.tw/library-about.html';
const jah = 'https://site.jah.org.tw/jah_library/1_about/1_mission/b.asp';
const army = 'https://803.mnd.gov.tw/dept/sn13/';
const dlps = 'https://dlps.tc.edu.tw/p/412-1350-7026.php?Lang=zh-tw';
const smgsh = 'https://www.smgsh.tc.edu.tw/lib/view.aspx?id=5';
const hustHours = 'https://lis.hust.edu.tw/?custom=25347&isEn=0&item=9&type=detail';
const hustAccess = 'https://lib.hust.edu.tw/?custom=1501&isEn=0&item=12&type=detail';
const ltuHours = 'https://ltu2501.video.ltu.edu.tw/p/page2';
const nchuHours = 'https://www.lib.nchu.edu.tw/service.php?cID=35';
const hepingRules = 'https://www.heping.taichung.gov.tw/983338/983564/983630/983636';
const xinshe = 'https://www.library.taichung.gov.tw/lib/Introduction/index?Parser=99,147,614';
const xitun = 'https://www.library.taichung.gov.tw/df_ufiles/lib08/臺中市西屯區圖書館討論室使用須知-1050301.pdf';
const ftjh = 'https://ftjh.tc.edu.tw/p/405-1137-42954,c18938.php';
const wpjh = 'https://wpjh.tc.edu.tw/p/405-1134-3087,c803.php';
const gmjh = 'https://gmjh.tc.edu.tw/var/file/161/1161/img/663539670.pdf';
const kfjh = 'https://kfjh.tc.edu.tw/p/406-1162-468231,r1012.php';
const cmshRoom = 'https://epaper.tc.edu.tw/application/show-article?id=3589';
const cmshStudy = 'https://cmsh.tc.edu.tw/p/406-1065-514730,r2388.php';
const kfjhReview: Review = {
  sources: [kfjh],
  note: '霧峰光復國中小共讀站供霧峰區民眾、學生及家長使用。學期中週一至週五 09:00–15:00，寒暑假週一至週五 09:00–12:00。獨立自修區及設備待確認。',
  areas: [{ name: '光復國中小共讀站', kind: 'reading', slots: null, access: 'conditional', equipment: {}, sources: [kfjh] }],
};

// The sources distinguish library-wide hours from the schedule of each study area.
export const taichungRuleReviews: Record<string, Review> = {
  東海大學圖書館: {
    sources: [thuRoom, thuRules, thuHours],
    note: 'B1 自修閱覽室供校內教職員生持證使用。一般學期平日 08:00–23:00、週末 09:00–21:00。寒暑假、考試和閉館日依館方公告。一般館內閱覽另有校外換證規則。',
    areas: [
      { name: 'B1 自修閱覽室 A 區筆電席', kind: 'study', slots: thuSlots, slotPeriod: thuTerm, access: 'restricted',
        seats: 6, equipment: { laptop: true, outlet: true, wifi: true }, sources: [thuRoom, thuRules, thuHours] },
      { name: 'B1 自修閱覽室 B 區', kind: 'study', slots: thuSlots, slotPeriod: thuTerm, access: 'restricted',
        seats: 126, equipment: { outlet: true, wifi: true }, sources: [thuRoom, thuRules, thuHours] },
    ],
  },
  逢甲大學圖書館: {
    sources: [fcuRules, fcuMembers, fcuHours],
    note: '科航館自修室須持本校證件或有效圖書館會員證。一般訪客換證適用總館，科航館另按會員規定。科航館學期間通常每日 08:00–24:00，考試期間及假日以公告為準。',
    areas: [{ name: '科航館 B1 自修室', kind: 'study', slots: null,
      access: 'conditional', reservation: 'https://libstudy.fcu.edu.tw/', equipment: {}, sources: [fcuRules, fcuMembers, fcuHours] }],
  },
  國立勤益科技大學圖書館: {
    sources: [ncutHours, ncutAccess],
    note: '校外人士可依規定換證入館，B1 自修閱覽區限校內使用。學期間平日 08:10–21:30，寒暑假關閉，考試週依公告延長。',
    areas: [{ name: 'B1 自修閱覽室', kind: 'study', slots: null, access: 'restricted', equipment: {}, sources: [ncutHours, ncutAccess] }],
  },
  國立臺中科技大學圖書館: {
    sources: [nutcHours, nutcAccess],
    note: '三民總館年滿 18 歲校外人士可持附照片證件換證。中正大樓 1 樓閱覽室限教職員工及在校生，學期間平日 08:00–22:00、週末 08:00–18:00，寒暑假及國定假日休館。',
    areas: [
      { name: '中正大樓 1 樓自修閱覽室', kind: 'study', slots: null, access: 'restricted', equipment: {}, sources: [nutcHours, nutcAccess] },
      { name: '三民總館閱覽區', kind: 'reading', slots: null, access: 'conditional', equipment: {}, sources: [nutcHours, nutcAccess] },
    ],
  },
  弘光科技大學圖書資訊處: {
    sources: [hkRoom, hkSpaces, 'https://lib.hk.edu.tw/'],
    note: '圖書館 3 樓靜音學習區依館方開館時間。G 棟 2 樓心悅書室以證件刷卡進入，學期間每日 08:10–21:00，考試與寒暑假另有安排。校外讀者能否使用這兩處空間仍待館方確認。',
    areas: [
      { name: '3 樓靜音學習區', kind: 'quiet', slots: null, access: null, equipment: {}, sources: [hkRoom] },
      { name: 'G 棟 2 樓心悅書室', kind: 'study', slots: parseSlots('週一至週日8:10至21:00'),
        slotPeriod: { from: '2026-09-14', until: '2027-01-16' }, access: null, equipment: {}, sources: [hkRoom, hkSpaces] },
    ],
  },
  朝陽科技大學波錠紀念圖書館: {
    sources: [cyutSpace, cyutHours],
    note: '1 樓校內安靜閱覽室從館外刷證進入，限朝陽教職員生。115 學年度第 1 學期週一至週五 08:00–23:00、週日 08:00–20:00、週六不開放，連假依館方公告。1 樓 iSpace 另供師生和社區民眾使用，開放式討論區也可個人閱讀，小組優先。部分座位有筆電插座。',
    areas: [{ name: '1 樓 iSpace 個人閱讀座位', kind: 'reading', slots: null, access: 'conditional',
      equipment: { laptop: true, outlet: true }, sources: [cyutSpace, cyutHours] }],
  },
  亞洲大學圖書館: {
    sources: [asiaSpace, asiaHours, asiaAccess, asiaReading],
    note: '校外人士須持附照片有效證件換臨時證。原則上同時段學期中 50 人、寒暑假 100 人，得視情況調整。一般閱覽區可安靜使用筆電，插座配置仍待確認。館外教室與宿舍自修室另有規則。',
    areas: [{ name: '館內一般閱覽區', kind: 'reading', slots: null, access: 'conditional',
      equipment: { wifi: true, laptop: true }, sources: [asiaSpace, asiaHours, asiaAccess, asiaReading] }],
  },
  修平學校財團法人修平科技大學圖書館: {
    sources: [hustHours, hustAccess],
    note: '115 學年度第 1 學期起，館方公布週一至四 08:00–17:00、週五 08:00–20:00、週末 11:00–15:00。校外借閱須依館方辦證規則。自修區獨立時段和資格仍待確認。',
  },
  國立臺灣體育運動大學圖書資訊處: {
    sources: [ntusRules, ntusHours],
    note: '館方 FAQ 列明年滿 20 歲校外讀者可持有效證件登記換證入館閱覽，每日 10 名。寒暑假開館時間另訂。',
    areas: [{ name: '館內閱覽區', kind: 'reading', slots: null, access: 'conditional', equipment: {}, sources: [ntusRules, ntusHours] }],
  },
  嶺東科技大學圖書館: {
    sources: [ltuHours],
    note: '館方公開全館開放時間，寒暑假依校方公告。自修空間的獨立時段與校外使用資格仍待確認。',
  },
  臺中市立臺中第一高級中等學校: {
    sources: [tcfshRules],
    note: '圖書館閱覽室供校內教職員工及學生自習，使用座位須登記或預約。校方規則列上課日 16:00–22:00、假日 08:00–22:00，異動另行公告。',
    areas: [{ name: '圖書館自習閱覽室', kind: 'study', slots: null, access: 'restricted', equipment: {}, sources: [tcfshRules] }],
  },
  臺中市立臺中女中: {
    sources: [tcgsRules, 'https://itcgs.tcgs.tc.edu.tw/library?cid=2163'],
    note: 'K 書中心以本校學生為限，他校學生須經許可。規則列每日 08:00–17:00，寒暑假另行公告。4 樓共讀站的校外資格依另一套規則。',
    areas: [{ name: 'K 書中心', kind: 'study', slots: null, access: 'restricted',
      equipment: { outlet: false }, sources: [tcgsRules] }],
  },
  國立中興大學附屬高級中學圖書館: {
    sources: [daliRules],
    note: '非住宿生上課日晚自習在 1 樓閱覽室，通常 18:30–21:00，須依規定預約並刷證。週五、例假日和寒暑假另有校內自習安排。',
    areas: [{ name: '1 樓閱覽室學生自習', kind: 'study', slots: null, access: 'restricted', equipment: {}, sources: [daliRules] }],
  },
  私立僑泰高級中學暨附設國中部圖書館: {
    sources: [ctasRoom, ctasRules],
    note: '校方公開學生課後自習的座位申請方式，由圖書館安排固定座位。實際開放時間以當學期校方安排為準。',
    areas: [{ name: '課後學生自習閱覽室', kind: 'study', slots: null, access: 'restricted', equipment: {}, sources: [ctasRoom, ctasRules] }],
  },
  臺中市立豐原高商: {
    sources: [fyvsRoom, 'https://fyvs.tc.edu.tw/p/404-1085-354447.php'],
    note: '1 樓閱覽室課後 17:00–21:00 及期中考前週末供學生自修。2 樓共讀站供社區居民利用，平日借還書時段依館方網站。',
    areas: [
      { name: '1 樓學生自修閱覽室', kind: 'study', slots: null, access: 'restricted', equipment: {}, sources: [fyvsRoom] },
      { name: '2 樓社區共讀站', kind: 'reading', slots: null, access: 'conditional', equipment: {}, sources: [fyvsRoom] },
    ],
  },
  國立中興大學附屬臺中高級農業學校圖書館: {
    sources: [tcavsRules],
    note: '共讀站平日 08:00–18:00，中午持續開放。社區民眾可憑身分證或電子借閱證入館瀏覽及借閱，活動時段另行公告。',
    areas: [{ name: '社區共讀站', kind: 'reading', slots: parseSlots('週一至週五8:00至18:00'),
      access: 'conditional', equipment: {}, sources: [tcavsRules] }],
  },
  臺中市立沙鹿高工: {
    sources: [slvsRules],
    note: '圖書館與共讀站另訂校內學生、教職員及社區讀者的利用規則。館方列上午 08:00–12:30、下午 13:30–17:00，遇考試或場地維護以公告為準。獨立自修時段仍待確認。',
    areas: [{ name: '社區共讀閱覽區', kind: 'reading', slots: null, access: 'conditional', equipment: {}, sources: [slvsRules] }],
  },
  臺中市立西苑高級中學暨附設國中部圖書館: {
    sources: [syshRoom],
    note: '共讀站歡迎社區民眾閱覽，週一至週五 08:00–17:00，寒暑假時段同為 08:00–17:00。週末有活動需求須洽圖書館。',
    areas: [{ name: '社區共讀站', kind: 'reading', slots: parseSlots('週一至週五8:00至17:00'),
      access: 'walk-in', equipment: {}, sources: [syshRoom] }],
  },
  臺中市立大里國民小學圖書室: {
    sources: [dlps],
    note: '共讀站官網仍列工程暫停對外開放通知，預計日期會依工程調整。恢復對外開放及現行時段待校方確認。',
  },
  臺中市立公明國民中學圖書室: {
    sources: [gmjh, 'https://gmjh.tc.edu.tw/p/403-1161-70.php?Lang=zh-tw'],
    note: '悠閱館共讀站平日 09:00–17:00，社區民眾可自由使用，優先服務學齡兒童、學生及親子共讀。幼童須由家長或監護人全程陪同，例假日或特殊情況另行公告。獨立自修區及設備待確認。',
    areas: [{ name: '悠閱館社區共讀站', kind: 'reading', slots: parseSlots('週一至週五9:00至17:00'),
      access: 'walk-in', equipment: {}, sources: [gmjh] }],
  },
  '臺中市立光復國民(中)小學圖書室': kfjhReview,
  '臺中市立光復國民中(小)學圖書室': kfjhReview,
  臺中市立至善國民中學圖書館: {
    sources: ['https://school.tc.edu.tw/open-message/193521/view-news/5939',
      'https://school.tc.edu.tw/open-message/193521/get-file/6965ba7af66a82934606e9a4'],
    note: '共讀站供校友、退休教職員工、教育志工及學生家長使用。首次到教務處辦借書證，其後持借書證及附照片證件向警衛換證。上班日 09:00–12:00、13:00–17:00，視人力調整。寒暑假另行安排。閱覽區不提供讀者 Wi-Fi 或座位充電，資訊檢索區另有公用電腦及網路。',
  },
  臺中市立東山高級中學暨附設國中部圖書室: {
    sources: ['https://tsjh.tsjh.tc.edu.tw/ischool/publish_page/8/?cid=1247', 'https://www.taichung.gov.tw/941961/post'],
    note: '校方館舍介紹列圖書音樂大樓 4 樓閱讀自修室。現行時段、入場資格及設備待確認。',
  },
  臺中市立忠明高級中學暨附設國中部圖書館: {
    sources: [cmshRoom, cmshStudy, 'https://cmsh.tc.edu.tw/index.php'],
    note: '臺中市教育電子報記載圖書資訊館 1 樓閱覽室供學生自修，設有空調、照明與茶水設備。114 學年度第 1 學期晚自習採申請與分配座位，規定不得使用平板或電腦。115 學年度的每日時段與設備規則請依當期公告。',
    areas: [{ name: '圖書資訊館 1 樓學生自修閱覽室', kind: 'study', slots: null, access: 'restricted',
      equipment: {}, sources: [cmshRoom, cmshStudy] }],
  },
  臺中市立新社高級中學暨附設國中部圖書館: {
    sources: ['https://lib.sshs.tc.edu.tw/webopac/holiday.aspx', 'https://school.tc.edu.tw/open-message/064328/get-file/6706381c5980dc4fb658a6a7',
      'https://digi.sshs.tc.edu.tw/school/Landing'],
    note: '館方行事曆列圖書館平日 08:00–17:00。校方文件列圖書館 1 樓自習室，另有校務平台提供晚自習預約。自習室的現行時段、入場資格及設備待確認。',
  },
  臺中市立豐東國民中學圖書館: {
    sources: [ftjh],
    note: '館方 2026 年 6 月更新規則，社區民眾可於另行公告的時段到館。校內讀者平日依作息開放，段考日休館。獨立自修室規則待確認。',
    areas: [{ name: '圖書館閱覽區', kind: 'reading', slots: null, access: 'conditional', equipment: {}, sources: [ftjh] }],
  },
  臺中市立外埔國民中學晨悅圖書館: {
    sources: [wpjh],
    note: '校方管理規則列開放對象為教職員工、學生及志工隊。平日 08:20–16:00 的下課時段提供借還書，定期評量當週暫停借閱。獨立自修時段仍待確認。',
    areas: [{ name: '晨悅圖書館館內閱覽', kind: 'reading', slots: null, access: 'restricted', equipment: {}, sources: [wpjh] }],
  },
  臺中市私立天主教曉明女子高級中學暨附設國中部圖書館: {
    sources: [smgsh],
    note: '館方公布圖書館使用及借閱規則。一般圖書館規則之外，自修室對外開放、時段與設備仍待確認。',
  },
  財團法人國泰建設文化教育基金會附設曉明霖園圖書館: {
    sources: [cathay],
    note: '基金會館舍名錄列曉明館週二至週六 14:00–21:00，提供民眾閱讀。獨立自修區及使用規則仍待確認。',
    areas: [{ name: '曉明館一般閱覽', kind: 'reading', slots: parseSlots('週二至週六14:00至21:00'),
      access: 'walk-in', equipment: {}, sources: [cathay] }],
  },
  仁愛醫療財團法人大里仁愛醫院圖書館: {
    sources: [jah],
    note: '院方圖書館頁面列大里院區 4 樓閱覽區，週一至週五 08:30–17:00。院外讀者的現行入館資格及自修使用仍待確認。',
    areas: [{ name: '大里院區 4 樓閱覽區', kind: 'reading', slots: null, access: null, equipment: {}, sources: [jah] }],
  },
  國軍臺中總醫院醫學圖書館: {
    sources: [army, 'https://803.mnd.gov.tw/dept/sn3/'],
    note: '館方服務本院同仁，並提供院外醫護藥衛專業人員及相關院校師生進館使用醫學資料。一般民眾自修服務仍待確認。',
    areas: [{ name: '醫學圖書館館內閱覽', kind: 'reading', slots: null, access: 'restricted', equipment: {}, sources: [army] }],
  },
  財團法人臺中市萬和宮附設圖書館: {
    sources: ['https://www.wanhegong.org.tw/html/library/01.aspx?num=23'],
    note: '3 樓閱覽區提供民眾使用，借書證須年滿 7 歲。個人自修室規則及閱覽區設備仍待確認。',
  },
  臺中市和平區立圖書館: {
    sources: ['https://www.heping.taichung.gov.tw/4086049/post', hepingRules],
    note: '2026 年 11 月 1 日恢復開館。週二至週日 08:00–17:00，法定國定假日公休。閱覽須知列明電子設備只能在指定區域充電；自修室的位置、獨立時段與座位插座仍待確認。',
  },
  國立中興大學圖書館: {
    sources: [nchuHours],
    note: '一般閱覽限年滿 18 歲、換證入館的校外人士。B1 自習室與興閱坊限校內身分。館方公布 2026/09/07–12/27 的學期時段及 2026/12/28–2027/01/31 的寒假時段，另有校定假日與考試公告。',
  },
  新社分館: {
    sources: [xinshe],
    note: '原館施工期間，臨時服務處設於興社街四段 1 巷 2 號。服務含辦證、領取預約書、還書及報紙閱覽，館方另列附近可自修的館舍。',
  },
  西屯分館: {
    sources: [xitun],
    note: '館方的討論室須知明訂討論室不得用於個人自修。獨立自習室時段仍待確認。',
  },
};

export function applyTaichungRuleReview(library: Library) {
  const review = taichungRuleReviews[library.name];
  if (!review) return;
  library.accessNote = review.note;
  library.reviewNote = '已核對館方公開資訊，缺漏欄位仍待核實';
  library.sources = [...new Set([...library.sources, ...review.sources])];
  if (review.areas) {
    const areas = new Map(library.areas.map((area) => [area.name, area]));
    for (const area of review.areas) areas.set(area.name, area);
    library.areas = [...areas.values()];
    if (review.areas.some((area) => area.kind === 'study')) library.studyRoom = true;
  }
}
