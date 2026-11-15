import { minutes, type Area, type Library } from './study.ts';
import { libraryStudyHours } from './library-study-hours.ts';
import { chiayiCountyReadingRules, libraryCalendar, penghuMainUrl, penghuStudyClosures, sanwanLibraryHours,
  tainanTuchengUrl, yuanlinLibraryRules } from './library-calendars.ts';
import { kaohsiungHoursSource, kaohsiungStudyRoom } from './kaohsiung-study-rules.ts';
import { tainanStudyRoom } from './tainan-study-rules.ts';
import { taipeiStudyRoom } from './taipei-study-rules.ts';
import nclStudyRooms from './ncl-study-rooms.json' with { type: 'json' };

export type LibraryDetail = { url: string; address: string; hours?: string; facilities?: string[] };

const wanluanTemporaryClosure = 'https://www.globgov.com/TW/Wanluan/1414151405576012/萬巒圖書館-暨萬巒Doc';
const buildingClosures: Record<string, Library['closures'][number] | undefined> = {
  'plis-5214bc11151c1cde5bf4': {
    from: '2025-08-01', reason: '大同路館舍因閱讀環境改善工程閉館，借書與通閱暫停。市公所規劃 2027 年 7 月恢復營運，實際日期依公告。',
    url: 'https://webws.miaoli.gov.tw/Download.ashx?n=MTE0RTAwMDQyNzUtMDEuUERG&u=LzAwMS9VcGxvYWQvNDY2L3JlbGZpbGUvMTQ5MTMvODcxNTc5LzlhMTA2YWExLTIwZmUtNGJhNS1hY2ViLTAwZDQ0NjNkNDYxZS5wZGY%3D',
  },
  'plis-4ae824a05d3504931b4e': {
    from: '2026-11-03',
    reason: '萬金臨時館因搬遷停館，借書、還書及館內閱覽暫停。還書可至佳佐分館，新館啟用日期另行公告。',
    url: wanluanTemporaryClosure,
  },
  'plis-d6eefd9316cdacfd6e67': {
    from: '2026-05-20', until: '2026-12-31',
    reason: '耐震補強工程期間暫停開館。萬榮鄉公所 2 樓文化暨觀光課提供現場還書及取書。恢復日期依館方公告。',
    url: 'https://www.wanrung.gov.tw/News_Content.aspx?n=11750&s=209430',
  },
  'plis-6834a05fd469c4134918': {
    from: '2026-10-31', until: '2026-12-31',
    reason: '新館工程尚未完竣，暫停開放至 2026 年 12 月 31 日。國姓鄉立圖書館館藏可投還書箱。恢復日期依館方公告。',
    url: 'https://www.guoshing.gov.tw/Announcement/news?PageType=1&id=955b6a55-57b9-4523-a588-3ad0b6e8ac33&pageIndex=1',
  },
  'plis-9895c2461ceb573cd713': {
    from: '2026-04-13', until: '2026-12-04', reason: '泰安鄉立圖書館因耐震補強工程暫停開放。',
    url: 'https://www.taian.gov.tw/News_Content.aspx?n=3892&s=999181',
  },
  'plis-5da75c6e4e69a34999e4': {
    from: '2025-03-25', reason: '配合大陳社區都市更新，自 2025 年 3 月 25 日起停止對外開放。',
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=e5bd7a8339d842c9951bbe5233d62368',
  },
  'plis-e65c73ff9e1179e30e89': {
    from: '2026-01-26', until: '2027-02-15',
    reason: '原館施工期間暫停開放。借還書及辦證請至東山區公所綜合大樓臨時據點（東山里 225 之 1 號）。週一 13:00–17:00、週二至週五 08:00–17:00、週末 08:00–16:00，國定假日休息。復館日期依館方公告。',
    url: 'https://www.tnpl.tn.edu.tw/n15511624106174947703/n1Content',
  },
  'plis-4f656e6f21c469e566ae': {
    from: '2026-06-01',
    reason: '原館整修暫停開放。臨時館位於水上村正義路 141 號舊樂齡中心，週一至週五 08:00–12:00、13:00–17:00 提供部分新書外借及還書，週末及國定假日休息。原館復館日期依公告。',
    url: 'https://www.cycab.gov.tw/wSite/ct?ctNode=5239&mp=1&xItem=13562',
  },
  'plis-95c10375e363b499b6fc': {
    from: '2026-09-24', until: '2026-12-31',
    reason: '西湖鄉立圖書館因館舍安全暫停開放，復館日期依館方公告。',
    url: 'https://udn.com/news/amp/story/7324/9775214',
  },
  'plis-d08bf679986d39ae195e': {
    from: '2026-08-20', until: '2027-02-28',
    reason: '坪林分館原館施工閉館。2026 年 9 月 1 日起由坪林茶業博物館 3 號展間提供臨時閱覽、預約取書、還書及辦證，復館日期依公告。',
    url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=f1a94fd6b5b541aa89d0702989c33d77',
  },
  'plis-114080cf8fa32977d08a': {
    from: '2026-11-16', until: '2026-11-16', reason: '東湖分館地板更新工程閉館一日。',
    url: 'https://reading.tpml.gov.taipei/News_Content.aspx?n=B3B7F57C7B16FDE6&s=009F3A24D6536E3E',
  },
  'plis-5700fc946f2296c185af': {
    from: '2026-08-27', until: '2027-01-06',
    reason: '貢寮分館設備升級施工，館內閱覽、自修及資訊檢索暫停，3 樓門口另設臨時櫃檯。',
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=49bddcd1aefb4384b3f376e4ec31e780',
  },
  'plis-b9b43f111c155ee7f7b1': {
    from: '2026-06-29', reason: '三和分館耐震補強及室內整修期間暫停開放，預計 12 月復館，日期以館方公告為準。',
    url: 'https://www.typl.gov.tw/zh-tw/News/Content/3120',
  },
  'plis-37cd73be99573999d94d': {
    from: '2026-03-05', reason: '瑞穗原館耐震補強暫停開放。借閱服務移至溫泉路一段 1 號臨時圖書館（瑞穗站後站對面）。',
    url: 'https://www.juisui.gov.tw/News_Content.aspx?n=3419&s=204355',
  },
  'plis-2fcff6be9344e712594c': {
    from: '2022-03-01', reason: '宜蘭縣文化局圖書館因縣級圖書館總館工程閉館，復館日期以館方公告為準。',
    url: 'https://www.suao.gov.tw/News_Content.aspx?n=9043&s=385366&sms=13359',
  },
  'plis-5b3805f2ce866586020e': {
    from: '2020-03-16', reason: '新竹市圖書館總館閉館重建中，復館日期以館方公告為準。',
    url: 'https://culture.hccg.gov.tw/ch/home.jsp?dataserno=202003030006&id=531&mcustomize=municipalnews_view.jsp&mserno=201601300215&parentpath=&t=MunicipalNews&toolsflag=Y',
  },
  'plis-eb5cc227330385ea9b00': {
    from: '2026-03-02', reason: '自 2026 年 3 月 2 日起閉館施工，復館日期以館方公告為準。',
    url: 'https://www.cna.com.tw/postwrite/chi/425420',
  },
  'plis-645a77676fc64f962dcf': {
    from: '2026-04-11',
    reason: '文化局圖書館自 2026 年 3 月 2 日起整修，普通閱覽室服務至 4 月 10 日。預計 2027 年 2 月底完成整修，復館日期以館方公告為準。',
    url: 'https://twainews.com/chiayiCity/news/H6AVvMXtFIMXzE8zULEN',
  },
  'plis-79f43b2ba26bb9afade0': {
    from: '2026-01-01', reason: '崎頂分館自 2026 年 1 月 1 日起因搬遷至埔頂分館停止開放。',
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/02',
  },
};

const xinyuanUrl = 'https://www.cultural.pthg.gov.tw/library/cp.aspx?n=CDFE6D1C65C796B9&s=EBBCF8C0C79D379A';
const minxiongRenovation = 'https://www.cycab.gov.tw/wSite/ct?ctNode=5231&mp=1&xItem=13575';
const xinyuanHours = '週二至週日 08:00–12:00、13:00–17:00。週一、國定假日及每月最後一個星期四休館。';
const kinmenCollectionPolicy = 'https://isp.ncl.edu.tw/files/file_pool/1/0O065604454792753757/金門縣公共圖書館館藏發展政策.pdf';
const jinshaReopening = 'https://www.kinmen.gov.tw/News_Content2.aspx?n=98E3CA7358C89100&s=CFD61B662D63D7C9&sms=BF7D6D478B935644';
const nantouEarlyReading = 'https://www.nthcc.gov.tw/A7_1/content/31020';
const dashuFloors = 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,65,676,669';
const taipeiBranchDirectory = 'https://tpml.gov.taipei/cp.aspx?n=1F9AED300D314011';
const qionglinLibrary = 'https://hcplibrary.hchcc.gov.tw/wSite/sp?idPath=4292_4295&mp=1&orgId=007&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp';
const fuxingLibraryServices = 'https://www.fuxing.tycg.gov.tw/cp.aspx?n=7100';
const yuminCleaning = 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=05b04bc605814183badfe83e28bd8af1';
const localFacilityLists: Record<string, { url: string; facilities: string[] } | undefined> = {
  'plis-7d5f6b4a8aae37204a84': {
    url: 'https://www.phlib.nat.gov.tw/wSite/sp?ctNode=6220&mp=1&orgId=006&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    facilities: ['1 樓閱讀區', '1 樓網路資訊區', '2 樓兒童室', '2 樓期刊雜誌區', '2 樓漫畫休閒區', '3 樓閱讀區', '3 樓視聽中心'],
  },
  'plis-9c4e98f5a888073fdc0c': {
    url: 'https://www.phlib.nat.gov.tw/wSite/sp?ctNode=5236&mp=1&orgId=007&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    facilities: ['1 樓一般閱讀區', '1 樓兒童閱讀區', '1 樓閱報區', '1 樓期刊區', '1 樓文史資料室', '1 樓資訊區',
      '2 樓電腦教室', '2 樓新住民交流中心', '2 樓西嶼文物展示區', '2 樓多功能研習中心'],
  },
  'plis-d34887b8b49b91a79656': {
    url: nantouEarlyReading,
    facilities: ['嬰幼兒閱讀專區／書櫃'],
  },
  'plis-e641450483afbb290910': {
    url: 'https://www.cultural.pthg.gov.tw/library/cp.aspx?n=CDFE6D1C65C796B9&s=0B1331E5BD08A09E',
    facilities: ['兒童閱覽室', '書庫', '期刊區', '視聽區', '閱讀區'],
  },
  'plis-f115f1f71be7cccd30e1': {
    url: xinyuanUrl,
    facilities: ['1 樓流通服務台', '1 樓閱讀及書報區'],
  },
  'plis-05da96e29ca78b9de81a': {
    url: fuxingLibraryServices,
    facilities: ['1 樓親子讀書區', '1 樓親子視聽間', '1 樓公用電腦', '2 樓 K 書中心', '3 樓館藏書冊區'],
  },
  'plis-d6ac06f6cad9dfaa9dfa': {
    url: 'https://www.lotong.gov.tw/UploadDir/Announcement/5%E8%87%AA%E6%B2%BB%E6%A2%9D%E4%BE%8B.pdf',
    facilities: ['圖書閱覽室'],
  },
  'plis-5b3805f2ce866586020e': {
    url: 'https://www.hccg.gov.tw/uploaddowndoc?file=LifemonthlyEpaper%2F201911291351490.pdf&flag=doc',
    facilities: ['地下 1 樓兒童閱覽室及密集書庫', '1 樓一般閱覽室', '2 樓視聽室及數位檢索區', '3 樓竹塹文獻室'],
  },
  'plis-5da75c6e4e69a34999e4': {
    url: buildingClosures['plis-5da75c6e4e69a34999e4']!.url,
    facilities: ['童書區', '繪本區', '幼兒書區', '外文區', '期刊區', '視聽區', '漫畫區', '資訊檢索區'],
  },
  'plis-79f43b2ba26bb9afade0': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/02',
    facilities: ['閱報區', '服務諮詢處', '開放閱覽室', '書庫'],
  },
  'plis-eb5cc227330385ea9b00': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000308',
    facilities: ['1 樓期刊室', '2、3 樓普通閱覽室'],
  },
  'plis-27e42cf8f073cee7c04f': {
    url: 'https://www.library.taichung.gov.tw/lib/Introduction/index?Parser=99,108,224',
    facilities: ['兒童區', '樂齡區', '文學區', '青少年區', '戶外閱讀區', '一般圖書區', '臺中作家圖書區', '大講堂',
      '多媒體區', '討論室', '筆電席位', '電梯', '資訊檢索區', '哺集乳室', '親子廁所', '自動借還書機'],
  },
  'plis-ed53f27461a95b24573d': {
    url: 'https://libstat.ncl.edu.tw/libraryDataDetail/L3351000',
    facilities: ['1 樓報紙期刊區', '1 樓兒童書庫', '1 樓自修區', '2 樓成人書庫', '地下室活動空間'],
  },
  'plis-3770cd75f85a5448f57c': {
    url: 'https://isp.ncl.edu.tw/child-tw/cityres?res=0K313034432720993533',
    facilities: ['兒童專區'],
  },
  'plis-3832d23bbe5146a74169': {
    url: 'https://www.nlpi.edu.tw/StaticPage/main-floors',
    facilities: ['地下 1 樓自修閱覽室', '兒童學習中心', '自助借還書區', '新書展示區', '期刊閱覽區', '樂齡閱覽區', '多元文化區', '留學資料區', '視聽區'],
  },
  'plis-ae310f74e5c07b98a13a': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000195',
    facilities: ['期刊閱報室', '兒童室', '網路資源室', '書庫', '4 樓讀者自修室'],
  },
  'plis-50a85fd5bd2678f089ba': {
    url: 'https://gutss.blogspot.com/2023/11/blog-post_21.html',
    facilities: ['1 樓自修區', '閱報室', '4 樓讀者上網區', '期刊雜誌閱覽區', '親子與兒童閱覽區', '5 樓書庫', '視聽室'],
  },
  'plis-5931f90c2b78f1094592': {
    url: xinyuanUrl,
    facilities: ['1 樓兒童室', '1 樓期刊報紙區', '2 樓閱讀區', '3 樓圖書區', '3 樓多功能視聽室', '4 樓圖書區', '2 樓公廁', '3 樓公廁'],
  },
  'plis-290186a03e719a9c8bee': {
    url: 'https://gutss.blogspot.com/2024/01/blog-post.html',
    facilities: ['電梯', '1 樓兒童室', '2 樓自修室', '開架閱覽室'],
  },
  'plis-66e53f44f93b7f476b11': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000267',
    facilities: ['無障礙電梯'],
  },
  'plis-1fc4f3afa8489d59630b': {
    url: 'https://isp.ncl.edu.tw/infant-tw/cityres?res=0K291754204183172606',
    facilities: ['嬰幼兒專區'],
  },
  'plis-6c7f064db2438bb7406f': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000277',
    facilities: ['開架閱覽區', '兒童書房', '銀髮族區', '報紙閱讀區', '期刊區', '動漫區', '小團體觀賞區', '青少年電腦網路區', '青少年專區', '自修與閱讀區', '新書展示區'],
  },
  'plis-b087f747f24f38293e86': {
    url: 'https://dsh.yunlin.gov.tw/News2.aspx?n=7063&sms=14636',
    facilities: ['閱覽區', '公用電腦區'],
  },
  'plis-d31d9ccdab3c7bcf9ff3': {
    url: 'https://twpowernews.com/news_pagein.php?n_id=282117',
    facilities: ['1 樓臨時服務櫃檯'],
  },
  'plis-96bdb053d7e967f965dc': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000493',
    facilities: ['兒童閱讀區', '親子閱讀區', '書報閱讀區', '期刊區', '網路區', '參考書區', '書庫', '一般閱讀區', '視聽會議室', '數位中心', '3 樓 K 書中心'],
  },
  'plis-c601d6fcc4e455f93f93': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000497',
    facilities: ['資訊檢索設備', '兒童閱覽區'],
  },
  'plis-2495b652916c263fa25f': {
    url: 'https://itaiwan.moe.gov.tw/doc/about-list.php?doc=292',
    facilities: ['2 樓數位機會中心'],
  },
  'plis-740c2304a9a259e92df2': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000501',
    facilities: ['期刊閱報區', '圖書參考區', '親子共讀區', '網路查詢電腦區', '書庫', '閱覽區', '小型會議室', '視聽電腦教室'],
  },
  'plis-6475285c674791ca9696': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000503',
    facilities: ['地下室視聽室', '親子閱讀區', '電腦資訊區', '閱讀區', '交誼廳'],
  },
  'plis-d6eefd9316cdacfd6e67': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000504',
    facilities: ['期刊閱報區', '圖書參考區', '親子共讀區', '網路查詢電腦區', '書庫', '閱覽區', '視聽室', '小型會議室', '文物展示區'],
  },
  'plis-efe674464e6fce8f380e': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000505',
    facilities: ['兒童圖書館藏區', '英文繪本區', '中文繪本區', '視聽區', '多功能活動空間', '交流分享區', '戶外閱讀樹屋'],
  },
  'plis-2b1932820682ee253f7e': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000506',
    facilities: ['圖書閱覽區', '兒童閱覽區', '網路電腦區'],
  },
  'plis-fd6e00ddec2e11b087ad': {
    url: 'https://library-dl.yunlin.gov.tw/cp.aspx?n=9679',
    facilities: ['傑克與仙豆主題區', '綠野叢林區', '海底世界區', '白雲城堡區'],
  },
  'plis-f5b5d0c2ee6ce8477832': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000286',
    facilities: ['期刊閱報區', '電腦檢索區', '兒童室', '書庫', '2 樓參考室兼自修室', '2 樓研討室兼自修室'],
  },
  'plis-e9b3e2917254313b6d65': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000290',
    facilities: ['書庫', '雜誌報紙期刊閱覽室', '兒童室', '參考室', '3 樓自修室'],
  },
  'plis-0e472236b6cd90d7217c': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000291',
    facilities: ['書庫', '兒童閱覽區', '期刊閱覽區', '一般閱覽區', '電腦上網區'],
  },
  'plis-eb3e95a67263e5cbf917': {
    url: 'https://bjgov.yunlin.gov.tw/cp.aspx?n=6174',
    facilities: ['書庫', '報紙期刊區', '樂齡閱讀區', '兒童室', '青少年閱讀區', '2 樓自修室', '研習室'],
  },
  'plis-942c78ab15d304c768e8': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000297',
    facilities: ['民眾閱覽室', '親子閱覽室', '期刊雜誌閱覽區', '開架書庫', '展覽館', '會議室', '研習室', '閱讀室'],
  },
  'plis-bdad3aa0558bd2be752e': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000298',
    facilities: ['期刊室', '兒童閱覽室', '2 樓自修研習室', '視聽室'],
  },
  'plis-4de96f7422a39a1d9542': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000303',
    facilities: ['在地農產品與兒童繪本館藏特色專櫃'],
  },
  'plis-4fccd7810b59cf2800f5': {
    url: 'https://www.tnpl.tn.edu.tw/u5265933068424048176/a1',
    facilities: ['開架閱覽區', '英語學習區', '電腦網路區', '青少年區', '漫畫區', '討論室', '多功能室', '兒童區', '嬰幼兒區', '多元文化區', '樂齡區', '期刊報紙區'],
  },
  'plis-3428641ec78aeb601979': {
    url: 'https://www.tnpl.tn.edu.tw/Page/EachPavilionIndex.aspx?id=u4903210577041037183',
    facilities: ['兒童閱覽區', '嬰幼兒專區', '新書展示區', '樂齡閱覽區', '期刊閱報區'],
  },
  'plis-d6493c0ee9ea1f948cec': {
    url: 'https://www.tnpl.tn.edu.tw/Page/EachPavilionIndex.aspx?id=u4812346487589096684',
    facilities: ['年度新書區', '視聽區', '期刊區', '青少年區', '英文書區', '樂齡區'],
  },
  'plis-a3aa908413cf852b7708': {
    url: 'https://www.tnpl.tn.edu.tw/u4964966955243776974/a1',
    facilities: ['兒童圖書區', '兒童閱覽區', '嬰幼兒圖書區', '閱報區', '上網區', '新書展示區', '自修區', '討論室', '多功能研習教室'],
  },
  'plis-e65c73ff9e1179e30e89': {
    url: 'https://dongshan.tainan.gov.tw/News_Content.aspx?n=44262&s=8794510&sms=26921',
    facilities: ['臨時借還書服務櫃檯', '新書展示區'],
  },
  'plis-257f7ab6c6e6b452dd99': {
    url: 'https://www.tnpl.tn.edu.tw/u5755478225008582095/a1',
    facilities: ['青少年閱覽區', '影音上網區', '英語學習區', '多功能會議室', '討論室', '文學閱讀區', '開架閱讀區', '視聽資料區', '兒童閱覽區', '嬰幼兒專區', '樂齡閱覽區', '期刊閱報區', '資料檢索區', '新書展示區'],
  },
  'plis-98c2b5ee10d97cd2dcc5': {
    url: 'https://www.tnpl.tn.edu.tw/u5218061093444339773/a1',
    facilities: ['兒童區', '嬰幼兒區', '青少年區', '上網區', '視聽區', '多功能室'],
  },
  'plis-d5b370938477485a9b70': {
    url: 'https://www.tnpl.tn.edu.tw/u5132474722839973688/a1',
    facilities: ['新書區', '兒童區', '嬰幼兒區', '青少年區', '上網區', '視聽區', '閱報區', '樂齡區'],
  },
  'plis-0c2ace2641b37f2a19ac': {
    url: 'https://www.tnpl.tn.edu.tw/u5564135435474870361/a1',
    facilities: ['討論室', '漫畫區', '青少年區', '語言學習區', '多功能室', '視聽資料區', '電腦網路區', '筆電優先區', '開架閱覽區', '樂齡區', '兒童區', '嬰幼兒區', '多元文化區', '期刊報紙區'],
  },
  'plis-0cbbf1735c46d0a6488b': {
    url: 'https://www.tnpl.tn.edu.tw/u5540679532610183827/a1',
    facilities: ['青少年閱覽區', '英語學習專區', '一般閱覽區', '兒童閱覽區', '資料檢索區', '期刊閱覽室', '影音視聽區', '手工藝專區', '哺集乳室', '無障礙廁所'],
  },
  'plis-e1e2bc4b4c8213751baa': {
    url: 'https://www.tnpl.tn.edu.tw/Page/EachPavilionIndex.aspx?id=u4874045035169792199',
    facilities: ['兒童區', '嬰幼兒區', '青少年區', '上網區', '視聽區', '多功能室'],
  },
  'plis-1ab6b7cad75d50cee778': {
    url: 'https://www.cycab.gov.tw/wSite/ct?ctNode=6266&idPath=6253_6256_6266&mp=1&xItem=13422',
    facilities: ['書庫', '兒童室'],
  },
  'plis-613d73644fc40d8abe54': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000316',
    facilities: ['視聽設備', '網路查詢設備'],
  },
  'plis-4f656e6f21c469e566ae': {
    url: 'https://www.cycab.gov.tw/wSite/ct?ctNode=5239&mp=1&xItem=13562',
    facilities: ['臨時借還書服務櫃檯'],
  },
  'plis-7ef01c27698fc303f21c': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000321',
    facilities: ['館內藝文展示空間'],
  },
  'plis-7dba03a9a3c1c99da1e7': {
    url: 'https://isp.ncl.edu.tw/infant-tw/cityres?res=0K291754641712162219',
    facilities: ['嬰幼兒專區'],
  },
  'plis-160dd50bd9f6fe4751b0': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000324',
    facilities: ['月光廣場', '多功能教室', '展演區', '視聽教室', '網路資訊室'],
  },
  'plis-e1773325972df453b6c4': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000325',
    facilities: ['部落圖書資訊站'],
  },
  'plis-e9ad834b90b6ec26f69a': {
    url: 'https://www.nlpi.edu.tw/Publications/libpub/fc93fc86-82ee-4ac2-b285-f775096e3a2e/Journal/a5ade32b-7dea-4573-91de-aab0922ffc32/Articles?articleId=f42fb936-2e0f-4ab2-967b-24abc58c3076',
    facilities: ['學齡前閱讀區', '兒童閱讀區'],
  },
  'plis-a141c3b5fc0e2accfd60': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000328',
    facilities: ['兒童閱覽室', '親子共讀區', '報紙雜誌室'],
  },
  'plis-674920ab9a5621eaf6cf': {
    url: 'https://tour.taitung.gov.tw/zh-tw/news/details/6328',
    facilities: ['縱谷館藏閱讀區', '多媒體視聽室', '自修室', '自修室自動預約機', '預約書自助取書機', '自助借書機', '檢索電腦'],
  },
  'plis-3dc026b916c043fe287e': {
    url: 'https://www.changkang.gov.tw/news/news1/detail/9834',
    facilities: ['1 樓閱覽區（整修期間）'],
  },
  'plis-c9c0fe185180d1def859': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000509',
    facilities: ['2 樓展覽室', '閱讀室'],
  },
  'plis-93dad88977ecbd6b5773': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000511',
    facilities: ['電腦教室', '開架書庫', '兒童室', '閱覽室'],
  },
  'plis-949d8708d5597baaf12e': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000512',
    facilities: ['1 樓查詢電腦'],
  },
  'plis-32d35bec732d1fecb62d': {
    url: 'https://isp.ncl.edu.tw/teen-tw/cityres?res=0K313038577850072241',
    facilities: ['青少年專區'],
  },
  'plis-09b55d87247eb8201b76': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000516',
    facilities: ['閱覽室', '兒童讀書區', '育嬰室', '資訊查詢區', '書庫', '電腦教室', '投影設備'],
  },
  'plis-55fd79be7a9db6bbe14d': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000517',
    facilities: ['兒童室', '開架閱覽室', '期刊區', '多功能研習室'],
  },
  'plis-c8a5384b2a5dff72b0e6': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000518',
    facilities: ['視聽室', '兒童室', '閱覽室', '原住民族文物陳列室', '期刊室', '書庫', '資訊閱覽室', '室外閱覽室'],
  },
  'plis-41bce5bf027121bcb9e9': {
    url: 'https://isp.ncl.edu.tw/teen-tw/cityres?res=0K313038577850072241',
    facilities: ['青少年專區'],
  },
  'plis-10d0648b79179b027642': {
    url: 'https://travelss.net/2026/10/22/lanyu-round2-alley-stroll-2026/',
    facilities: ['閱覽區'],
  },
  'plis-58986cb17ea455f49a96': {
    url: 'https://isp.ncl.edu.tw/teen-tw/cityres?res=0K313038577850072241',
    facilities: ['青少年專區'],
  },
  'plis-e60fc801b70b3694e168': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000437',
    facilities: ['兒童區', '期刊雜誌區', '多功能教室', '公用電腦'],
  },
  'plis-421acf277000ebf61419': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000438',
    facilities: ['兒童閱覽室'],
  },
  'plis-c57afed8fc6cac37fad4': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000439',
    facilities: ['地下室兒童圖書專區', '1 樓生活資訊中心', '公用電腦', '無線上網區', '庭園廣場'],
  },
  'plis-afedb45a9eff2865c224': {
    url: 'https://isp.ncl.edu.tw/infant-tw/cityres?res=0K291754691357031236',
    facilities: ['嬰幼兒專區'],
  },
  'plis-48e5de0282ee6831ad5e': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000451',
    facilities: ['新書展示區', '期刊展示區', '兒童區', '閱報區', '電腦上網區', '成人閱覽區', '研習室'],
  },
  'plis-4d0c8d7a33e035e307ff': {
    url: 'https://isp.ncl.edu.tw/teen-tw/cityres?res=0K313038486137355169',
    facilities: ['青少年書櫃'],
  },
  'plis-5f395e10afdb6bce3358': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000456',
    facilities: ['兒童室', '閱報區', '期刊區', '產業特區', '視聽區', '書庫', '閱讀區', '2 樓 K 書中心', '上網區'],
  },
  'plis-1134a5363ae37dec5d31': {
    url: 'https://isp.ncl.edu.tw/infant-tw/cityres?res=0K291754691357031236',
    facilities: ['嬰幼兒專區'],
  },
  'plis-05b562ce5fb053cecf85': {
    url: 'https://isp.ncl.edu.tw/teen-tw/cityres?res=0K313038486137355169',
    facilities: ['青少年專區'],
  },
  'plis-b43cab28e604fed1ad99': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000463',
    facilities: ['1 樓圖書室', '2 樓原住民族文物展示空間'],
  },
  'plis-452d6d9aa6f6aa4a66f2': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000464',
    facilities: ['原住民族圖書區', '兒童閱覽區', '新書展示區', '一般圖書區', '自修閱覽區', '投影設備'],
  },
  'plis-6566fcec4f46617d8ca2': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000465',
    facilities: ['公用電腦', '書庫', '兒童閱覽室', '成人閱覽室', '視聽區', '2 樓研習活動空間'],
  },
  'plis-371a7c60bf29d84fe97b': {
    url: 'https://isp.ncl.edu.tw/infant-tw/cityres?res=0K291754691357031236',
    facilities: ['親子閱讀區'],
  },
  'plis-dd0e38aa18f750ffcade': {
    url: 'https://www.typl.gov.tw/zh-tw/News/Content/3345',
    facilities: ['1 樓臨時服務櫃檯', '1 樓還書箱'],
  },
  'plis-62eb0222ac5626717a13': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/044',
    facilities: ['期刊閱覽區', '報紙閱覽區', '上網區', '兒童閱覽室', '圖書閱覽區', '英文分級讀物專區', '研習教室', '藝文展覽區', '地下 1 樓自修室'],
  },
  'plis-8d09da2a8c7fc2f99893': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/010',
    facilities: ['閱報區', '開放閱覽室', '書庫'],
  },
  'plis-01e95280aebec7eba09c': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/017',
    facilities: ['自修室', '期刊閱報區', '兒童閱覽區', '視聽資料播放區', '研習教室'],
  },
  'plis-3fe72b1ccca37949b0a8': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/039',
    facilities: ['資訊檢索區', '期刊閱報區', '故事坊', '青少年漫畫區', '2 樓自修閱覽室', '書庫', '兒童室'],
  },
  'plis-9c317ee99e20f7ec3cd3': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/014',
    facilities: ['館藏區', '兒童區', '閱報區', '上網區', '研習教室', '6 樓自修室'],
  },
  'plis-77084e202fe916823f9a': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/032',
    facilities: ['一般閱覽區', '期刊區', '兒童閱覽區', '資訊檢索區', '主題書展區', '3 樓自修室'],
  },
  'plis-07c47313a8f5b473d2bf': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/028',
    facilities: ['兒童圖書室', '期刊閱報區', '個人視聽室', '書庫', '上網區', '無線上網筆電區', '3 樓自修閱覽室', '研習教室'],
  },
  'plis-094ed6f57775956545a2': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/046',
    facilities: ['期刊閱報區', '兒童閱覽室', '親子共讀區', '網路資源檢索區', '閱覽室', '文化教室', '3 樓自修室'],
  },
  'plis-68b3417f5a99cefe007d': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/049',
    facilities: ['期刊閱報區', '親子閱讀區', '閱覽區', '參考區', '網路資源檢索區', '1 樓自修室', '書庫'],
  },
  'plis-163c307c64aa5fc02e8a': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/048',
    facilities: ['兒童室', '閱覽室', '閱報區', '2 樓自修區', '期刊區', '網路檢索區', '無線上網區'],
  },
  'plis-ab3dfbc049455a84068e': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/047',
    facilities: ['兒童閱覽室', '自修室', '文化教室', '閱覽室', '網路資源檢索區'],
  },
  'plis-34e3306f3ab833c97a42': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/043',
    facilities: ['書庫', '特色館藏區', '期刊區', '上網區', '兒童室', '3 樓自修室', '筆電區'],
  },
  'plis-5f74f02b42c06b3fc9d9': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/016',
    facilities: ['自修室', '閱報區', '筆電區', '兒童閱覽區', '研習教室', '木地板教室'],
  },
  'plis-b4d4a98c101cbfdc3b6d': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/015',
    facilities: ['視聽資料播放區', '兒童閱覽區', '期刊閱報區', '自修室', '討論室'],
  },
  'plis-0670e73215c152add507': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/038',
    facilities: ['地下 1 樓自修室', '兒童親子閱讀區', '期刊報紙閱讀區', '青少年區', '館藏特色區'],
  },
  'plis-917334d7cea0e59828e0': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/031',
    facilities: ['一般閱覽區', '期刊區', '兒童閱覽區', '資訊檢索區'],
  },
  'plis-99799da6e29815c7da11': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/030',
    facilities: ['一般閱覽區', '期刊區', '兒童閱覽區', '資訊檢索區', '2 樓自修室', '閱報區'],
  },
  'plis-4f772c9702962d95b0f8': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/029',
    facilities: ['閱覽區', '期刊區', '兒童閱覽區', '資訊檢索區'],
  },
  'plis-e13b542aa05bf70e234a': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/011',
    facilities: ['兒童區', '期刊閱報區', '上網區', '自修室'],
  },
  'plis-62af35b79d7d88c393d7': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/027',
    facilities: ['書庫', '兒童閱讀區', '閱報期刊區', '參考區', '電腦網路區', '3 樓自修室', '筆電區'],
  },
  'plis-bb87f2dc7cdcad6eca8b': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/036',
    facilities: ['期刊閱覽室', '兒童室', '視聽教室', '自修閱覽室', '查詢用電腦室'],
  },
  'plis-b9b43f111c155ee7f7b1': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/013',
    facilities: ['閱報區', '閱讀區', '書庫'],
  },
  'plis-369d482f8c183f32943f': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/037',
    facilities: ['書庫', '期刊及閱報區', '2 樓自修室'],
  },
  'plis-6a9da03cdd3715adb30c': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/042',
    facilities: ['閱報區', '網路資訊區', '期刊區', '兒童室', '無線上網筆電區', '書庫', '參考室', '地方文獻室', '4 樓自修閱覽室', '多功能教室'],
  },
  'plis-112e55434de56841e873': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/051',
    facilities: ['閱覽室', '書庫', '兒童區', '期刊區', '視聽區', '5 樓自修室'],
  },
  'plis-b208b8b3efcd2c80cbaa': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/018',
    facilities: ['閱覽區', '期刊閱報區', '筆電區', '上網區', '視聽資料播放區', '會議室', '討論室'],
  },
  'plis-9df366887a25b0673ee7': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/04',
    facilities: ['閱覽區', '期刊閱報區', '筆電區', '上網區', '多功能研習教室'],
  },
  'plis-a38508dd33caf0cfefdc': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/034',
    facilities: ['1 樓自習室', '開架閱覽區', '多元音樂區', '兒童閱覽區', '樂齡閱覽區', '圖書館藝廊', '影音專區', '上網區', '研習室', '多功能教室'],
  },
  'plis-b4f11997a2a0f56cc70b': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '哺乳室', '無障礙電梯', '筆電區', '預約書自助取書區', '學習 E 樂園', '臺灣原住民族資料專區／書櫃', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-2795b0ebc2c7f0ecfff2': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '哺乳室', '無障礙電梯', '筆電區', '預約書自助取書區', '新住民閱讀專區／書櫃', '青少年閱覽區', '除菌箱'],
  },
  'plis-43a6f9462110b6734cd6': {
    url: taipeiBranchDirectory,
    facilities: ['還書箱', '哺乳室', '無障礙電梯', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-ae4afb661db999589383': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '哺乳室', '預約書自助取書區', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-5beb89d3a189941fdc17': {
    url: taipeiBranchDirectory,
    facilities: ['還書箱', '哺乳室', '無障礙電梯', '預約書自助取書區', '學習 E 樂園', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-89ca1a138e029a9ff0be': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '哺乳室', '無障礙電梯', '筆電區', '預約書自助取書區', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-7decf0dff68a9e8b198d': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '哺乳室', '無障礙電梯', '預約書自助取書區', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-c21ff2a6d5f510b7fccd': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '哺乳室', '無障礙電梯', '筆電區', '預約書自助取書區', '學習 E 樂園', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-a670c69b2a2a96a3d9fa': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '哺乳室', '無障礙電梯', '筆電區', '預約書自助取書區', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-8b76b5bd5da364ef7614': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '哺乳室', '無障礙電梯', '筆電區', '預約書自助取書區', '臺灣原住民族資料專區／書櫃', '除菌箱'],
  },
  'plis-c5ebd4287161428dd45e': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '哺乳室', '無障礙電梯', '筆電區', '預約書自助取書區', '臺灣原住民族資料專區／書櫃', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-edeec13b64c0ca4d0965': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '哺乳室', '無障礙電梯', '筆電區', '預約書自助取書區', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-d4a372e3044256cc569b': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '無障礙電梯', '預約書自助取書區', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-556af005b3614de06ca7': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '哺乳室', '無障礙電梯', '筆電區', '預約書自助取書區', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-0978ad84e2f92b807a42': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '無障礙電梯', '筆電區', '預約書自助取書區', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-9f8e62981180e7c9a7d3': {
    url: taipeiBranchDirectory,
    facilities: ['自修室', '還書箱', '哺乳室', '無障礙電梯', '筆電區', '預約書自助取書區', '新住民閱讀專區／書櫃', '除菌箱'],
  },
  'plis-3f6ed064ed62a36e4b9b': {
    url: 'https://www.ksml.edu.tw/mainlibrary/tour/index.aspx?Parser=13,23,937,158',
    facilities: ['地下 1 樓國際繪本中心', '1 樓廣場', '3 樓階梯閣樓', '4 樓公共藝術空間'],
  },
  'plis-0801decad6296ec8f992': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,83,1395,1384',
    facilities: ['1 樓常設展覽室', '2 樓高雄文學典藏圖書室', '文學沙龍', '文學放映室', '文學討論室'],
  },
  'plis-4818cd57388587303882': {
    url: 'https://khcc.kcg.gov.tw/rwd_home03.aspx?DATA=937&EXEC=D&ID=%246102&IDK=2',
    facilities: ['主題漫畫艙', '策展艙', '親子共讀城堡', '童趣探索區', '長桌閱覽席'],
  },
  'plis-4211973a59dada78d703': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,84,1394,1383',
    facilities: ['主題書展區', '兒童室', '學齡前閱讀區', '愛讀屋', '戶外區', '多媒體聆賞區', '影音資料典藏室', '視聽座位區', '期刊區'],
  },
  'plis-fa8e93058283261d5014': {
    url: 'https://isp.ncl.edu.tw/teen-tw/cityres?res=0K313038146963811602',
    facilities: ['青少年專區'],
  },
  'plis-414fcbfe793f5201f41d': {
    url: 'https://isp.ncl.edu.tw/teen-tw/cityres?res=0K313038146963811602',
    facilities: ['青少年專區', '原住民文學專櫃'],
  },
  'plis-7271fb9a7171b6c1464f': {
    url: 'https://tauyuan.kcg.gov.tw/Content_List.aspx?n=ED1FBAA2576B235E',
    facilities: ['書庫', '閱覽室'],
  },
  'plis-accfa2ef1b61329335bb': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,36,357,350',
    facilities: ['地下 1 樓自修室', '1 樓兒童閱覽室', '研習室', '親子活動區'],
  },
  'plis-b62491efa4f22c150828': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,82,909,902',
    facilities: ['地下 1 樓兒童區', '多功能研習室', '臺灣文史專區', '資訊檢索區', '期刊區', '閱報區', '視聽資料區', '書庫'],
  },
  'plis-07432e289be30af20610': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,47,478,471',
    facilities: ['上網區', '新書展示區', '海報藝廊', '藝術圖書室', '幸福家庭閱讀專區', '列印設備'],
  },
  'plis-ee0d8a411a3c1654c1fa': {
    url: dashuFloors,
    facilities: ['電腦資訊查詢區', '期刊區', '書庫', '閱報區', '兒童閱覽區', '2 樓讀者自修參考區', '戶外休閒閱讀區'],
  },
  'plis-9f200d6bbcb863c3920a': {
    url: dashuFloors,
    facilities: ['多功能活動室', '兒童閱覽區', '資訊檢索區', '期刊區', '閱報區', '樂齡專區', '書庫', '地方文獻區', '青少年專區', '漫畫區', '3 樓自修區', '無線上網區', '多功能研習室'],
  },
  'plis-8486d4a3c8ec9b23b8e9': {
    url: dashuFloors,
    facilities: ['網路資訊查詢區', '兒童閱覽區', '期刊閱報區', '自修區', '主題書展區', '書庫'],
  },
  'plis-10ddca249245164caff7': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,66,687,680',
    facilities: ['兒童閱覽室', '期刊區', '書庫', '臺灣文史專區', '青少年文學專櫃', '電腦資訊檢索區', '自修室', '閱報區'],
  },
  'plis-d82268be588a7123b55a': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,31,302,295',
    facilities: ['兒童閱覽區', '期刊區', '樂齡專區', '資訊檢索區', '視聽資料區', '哺集乳室', '成人書庫', '無線上網區', '青少年區', '3 樓自修區', '閱報區', '多功能研習教室'],
  },
  'plis-d624fdace694450c004a': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,32,313,306',
    facilities: ['1 樓自修室', '閱報室', '兒童閱覽室', '資訊檢索區', '書庫', '臺灣文史專區', '期刊區', '海洋生物特色館藏區'],
  },
  'plis-71ef1498638c72cb65da': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,33,324,317',
    facilities: ['禮堂', '研習室', '3 樓自修室', '體育與運動特色館藏區', '青少年及漫畫專區', '無線上網區', '書庫', '兒童區', '閱報區', '期刊區', '樂齡區', '資料檢索區'],
  },
  'plis-f837393150c2835dca29': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,34,335,328',
    facilities: ['親子共讀區', '旅遊專區', '臺灣資料專區', '期刊公報區', '圖書資訊研習室', '好書交換分享區', '閱報區', '2 樓自修室', '多功能教室', '魔法故事屋'],
  },
  'plis-341b5eb29091a999eb6d': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,35,346,339',
    facilities: ['兒童閱覽區', '親子共讀區', '閱報區', '資訊檢索區', '三民實驗劇場', '多功能研習教室', '成人書庫', '臺灣資料區', '期刊室', '4 樓自修室', '裝訂報紙典藏室'],
  },
  'plis-777d6726d52d0b28eb51': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,38,379,372',
    facilities: ['4 樓自修室', '閱報區', '多功能活動室', '書庫', '兒童閱覽區', '資訊檢索區', '過期報紙區', '期刊區'],
  },
  'plis-037404bb59864ffe1a19': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,40,401,394',
    facilities: ['自修室', '閱報區', '資訊檢索區', '期刊區', '書庫', '臺灣文史專區', '兒童圖書區', '地方文獻特色館藏區'],
  },
  'plis-a908448b0b36ed1715ce': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,41,412,405',
    facilities: ['閱報室', '無線上網室', '4 樓自修室', '上網區', '期刊區', '開架閱覽區', '討論室', '主題書展示區', '影印設備'],
  },
  'plis-793de43144ebd1a7578c': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,42,423,416',
    facilities: ['開放閱覽區', '兒童圖書區', '期刊閱報區', '資訊檢索區'],
  },
  'plis-746d36c88f898d0e8c07': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,43,434,427',
    facilities: ['普通圖書區', '兒童圖書區', '期刊區', '資訊檢索區', '閱報區', '多功能教室', '自修室'],
  },
  'plis-c7774590d6dd49cecbb9': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,46,467,460',
    facilities: ['親子閱讀區', '視聽區', '電腦檢索區', '兒童圖書區', '環境教育專區', '多功能教室', '閱報區', '書庫', '臺灣資料專區', '樂齡圖書區', '青少年圖書區', '太空科學專區', '外文圖書區'],
  },
  'plis-3f58876c12dd20557b26': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,48,489,482',
    facilities: ['勞工與多元文化館藏區', '臺灣資料專區', '無線上網區', '個人閱覽座位', '藝文研習室', '閱報區', '公用電腦區', '視聽資料區', '期刊區', '親子共讀區', '多功能活動室', '書庫'],
  },
  'plis-c51f482514b80a660667': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,49,500,493',
    facilities: ['資訊檢索區', '閱報區', '期刊區', '兒童閱覽區', '樂齡圖書專區', '親子共讀區', '多元文化專區', '美國資料中心', '筆電使用區', '無線上網區', '書庫', '多功能教室'],
  },
  'plis-216cea038dcd5ebbfa28': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,53,544,537',
    facilities: ['兒童閱覽區', '開架式閱覽區', '雜誌區', '網路資料查詢區', '多功能活動室', '閱報區', '青少年專區', '地方文獻區', '無線上網區'],
  },
  'plis-ba0ab6ac6ab1829d39fc': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,54,555,548',
    facilities: ['資訊檢索區', '兒童閱覽區', '新書展示區', '閱報區', '期刊區', '開架書庫', '影音資料區', '無線上網區', '多功能教室', '臺灣文史專區', '哺集乳室'],
  },
  'plis-3b8c4a64ab4b313ed42f': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,54,555,548',
    facilities: ['資訊檢索區', '兒童閱覽區', '閱覽區', '開架書庫', '期刊區', '特色館藏區'],
  },
  'plis-a0dd6959841927ca7597': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,55,566,559',
    facilities: ['嬰幼兒閱讀專區', '養殖漁業特色館藏', '哺乳室', '期刊報紙區', '資訊區', '兒童閱覽區', '臺灣文史專區', '開架閱覽區'],
  },
  'plis-3b604bb555eaf744251d': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,55,566,559',
    facilities: ['兒童閱覽區', '開架閱覽區', '臺灣文史專區', '樂齡專櫃', '昆蟲專區', '期刊報紙區', '青少年專區', '漫畫區', '資訊區', '東南亞專區', '皮影藝術專區', '會議室', '多功能研習室'],
  },
  'plis-41a4c4cde2f3e85ef444': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,57,588,581',
    facilities: ['兒童閱讀區', '資訊檢索區', '新書展示區', '書報閱讀區', '自修閱讀區', '多功能演講廳', '藝文作品展示區', '開架閱讀區', '多功能研習教室'],
  },
  'plis-2743e51569604910aa7d': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,59,610,603',
    facilities: ['多功能教室', '期刊閱報區', '兒童閱覽室', '開放式書庫', '閱覽室'],
  },
  'plis-bffc737f45f33bf2784f': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,61,632,625',
    facilities: ['資訊檢索區', '期刊閱報區', '新書展示區', '視聽資料區', '兒童閱覽區', '親子共讀區', '地質與茶道館藏區', '樂齡圖書專區', '開放閱覽書庫', '臺灣文史專區', '青少年書區'],
  },
  'plis-f1aa9ffd4a0fa0eb0db4': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,63,654,647',
    facilities: ['兒童書庫區', '兒童漫畫區', '幼兒親子區', '新書展示區', '期刊報紙區', '資訊檢索區', '哺集乳室', '成人書庫', '主題書區', '文獻展示區', '3 樓自修室'],
  },
  'plis-ae1d09fa9a4aa5086830': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,64,665,658',
    facilities: ['成人書庫', '親子閱覽區', '資訊檢索區', '期刊閱報區', '青少年及漫畫專區', '無線上網區', '臺灣資料區', '2 樓自修室', '多功能室'],
  },
  'plis-d2b9978b7282cea0d7d6': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,67,698,691',
    facilities: ['新書展示區', '兒童閱覽區', '期刊區', '閱報區', '資訊檢索區', '書庫', '漫畫區', '無線上網區', '視聽教室兼會議室'],
  },
  'plis-c047eb13f7af010983af': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,68,709,702',
    facilities: ['兒童閱覽區', '上網區', '成人書庫', '期刊區', '閱報區', '3 樓自修室'],
  },
  'plis-571498276550037f205c': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,69,720,713',
    facilities: ['藝文展示區', '期刊室', '兒童閱覽區', '書庫', '參考資料室', '研習室', '4 樓自修室'],
  },
  'plis-88c4b0b28fd9dc888207': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,70,731,724',
    facilities: ['報章期刊區', '資訊檢索區', '書庫', '兒童室', '融合玩具專櫃', '哺乳室', '2 樓自修區', '眷村地方文化典藏室'],
  },
  'plis-7cc14413d0d90dc8c1d7': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,72,753,746',
    facilities: ['新書區', '臺灣資料專區', '網路檢索區', '無線上網區', '報章雜誌閱覽區', '自修區'],
  },
  'plis-456d4497ec2566631be6': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,75,786,779',
    facilities: ['兒童閱覽室', '雜誌區', '電腦區', '約翰湯姆生攝影展示區', '書庫閱覽區', '哺乳室', '多功能研習教室'],
  },
  'plis-998ee9249ae3def9f7ef': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,76,797,790',
    facilities: ['展示區', '期刊區', '資訊檢索區', '兒童閱覽區', '幼兒圖書區', '說故事區', '外文圖書區', '哺集乳室', '討論室', '親子廁所', '書庫', '臺灣資料區', '漫畫區', '青少年圖書區'],
  },
  'plis-c69dfa5e4b1461ef7a40': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,76,797,790',
    facilities: ['1 樓閱覽區', '閱報區'],
  },
  'plis-e64dc93b08a2aa723db1': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,76,797,790',
    facilities: ['兒童區', '1 樓閱覽區', '閱報區'],
  },
  'plis-51fac3088b9938f8f9ed': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,76,797,790',
    facilities: ['2 樓閱覽區', '兒童區', '閱報區'],
  },
  'plis-9132dca3383e3ab8f634': {
    url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,36,357,350',
    facilities: ['閱覽區', '期刊區', '參考區', '法律資料區', '臺灣資料專區', '資訊檢索區', '視障資料室'],
  },
  'plis-539f7d3d76b9f2ee658a': {
    url: 'https://www.cna.com.tw/postwrite/chi/444234',
    facilities: ['2 樓兒童圖書區', '4 至 6 樓館藏及閱覽區', '7 樓竹塹講堂',
      '7 樓迎曦會議室', '7 樓拱辰會議室', '7 樓歌薰會議室', '7 樓挹爽會議室'],
  },
  'plis-8e698a4770cf01e3875e': {
    url: 'https://www.nthcc.gov.tw/A2_4',
    facilities: ['期刊室', '親子幼兒區', '喜閱兒童區', '影音視聽區', '一般圖書區', '南投縣文學資料館', '陳千武文庫', '4 樓自由閱讀區'],
  },
  'plis-7b95877ab74c89a1e379': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000242',
    facilities: ['兒童閱覽區', '視聽簡報室', '報紙閱讀區', '期刊閱讀區', '巫永福文庫', '社區研習教室', '網路資源教室'],
  },
  'plis-deb1ef0655457767967c': {
    url: nantouEarlyReading, facilities: ['嬰幼兒閱讀專區／書櫃'],
  },
  'plis-3dc56ee3bc5b96de674c': {
    url: 'https://www.nthcc.gov.tw/A7_6/content/211',
    facilities: ['1 樓兒童閱覽室', '1 樓報紙期刊室', '1 樓電腦檢索區', '2 樓視聽室', '2 樓書庫'],
  },
  'plis-886db9d10796c91fe608': {
    url: nantouEarlyReading, facilities: ['嬰幼兒閱讀專區／書櫃'],
  },
  'plis-85a3abe63d4ba7d005b7': {
    url: 'https://www.tungshiau.gov.tw/cp.aspx?n=5679',
    facilities: ['閱覽室', '視聽室', '演講廳'],
  },
  'plis-cb71eb01e4c6590c8846': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/SubsidyProgram/PlanInfo/MF00000010?tab=2',
    facilities: ['期刊展示櫃', '書架'],
  },
  'plis-1c304ff42dd5276d9acf': {
    url: 'https://isp.ncl.edu.tw/child-tw/cityres?res=0K134647632978782512',
    facilities: ['兒童閱讀區'],
  },
  'plis-189e26aab70c5cb51cdd': {
    url: 'https://www.ctmanga.com/a/zheng-jian-you-shan-duo-yuan-yue-du-huan-jing-nan-zhuang-tu-shu-guan-qi-yong.html',
    facilities: ['嬰幼兒閱讀專區', '青少年閱讀專區', '閱報與期刊雜誌區', '新書展示區', '多元文化區', '無障礙電梯'],
  },
  'plis-95c10375e363b499b6fc': {
    url: 'https://www.xihu.gov.tw/News_Content.aspx?n=3622&s=706157',
    facilities: ['閱覽室', '兒童室', '書庫', '期刊室', '視聽教室', '研習教室'],
  },
  'plis-4ee8f2321103a6f17ad7': {
    url: 'https://www.hakka.gov.tw/chhakka/app/data/view?id=21&module=epaper&serno=b829d46a-3e85-43d5-a09b-bff3a6ba324d',
    facilities: ['銀髮族閱讀區', '兒童閱覽室', '地方文史館'],
  },
  'plis-eaf18916c54c8e1fffc3': {
    url: 'https://www.yuanli.gov.tw/News.aspx?n=7575&sms=13790',
    facilities: ['團體討論室', '哺乳室', '公用電腦', '列印及複印設備'],
  },
  'plis-687f7b5047ffb263f313': {
    url: 'https://opendata.miaoli.gov.tw/OpenDataDetail.aspx?n=9404&s=1811',
    facilities: ['3 樓自修室'],
  },
  'plis-8ec15d072d689e24a3b1': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000156',
    facilities: ['書區', '電腦區', '視聽區', '閱覽區', '兒童圖書區'],
  },
  'plis-859b54d11aaf9ac7b9be': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000157',
    facilities: ['1 樓自修室', '成人書庫區', '一般閱覽席', '期刊區', '電腦網路區', '兒童閱覽區'],
  },
  'plis-9709456f17abc6c6a512': {
    url: 'https://library.hccg.gov.tw/chhcml/app/digital/view?id=73&module=branchLibrary&serno=ab7c9460-79dd-4d1a-8ace-549cd24d28b1',
    facilities: ['成人讀物區', '雜誌報紙及視聽區', '兒童閱覽區', '自修室'],
  },
  'plis-29ea3972b0a938ef5d16': {
    url: 'https://libstat.ncl.edu.tw/libraryDataDetail/L5001001',
    facilities: ['一般閱覽室', '兒童區', '幼兒閱讀區'],
  },
  'plis-2efbf4bcfe8e68151f65': {
    url: 'https://www.nlpi.edu.tw/Publications/libpub/fc93fc86-82ee-4ac2-b285-f775096e3a2e/Journal/fdae4308-f74b-4fdf-9830-caeea32a4ca0/Articles?articleId=530aec90-67ba-4eef-ba2b-e04048daee30',
    facilities: ['無障礙電梯'],
  },
  'plis-fb0648ec4fff7472b345': {
    url: 'https://kllib.klcg.gov.tw/cp.aspx?n=7935', facilities: ['開架式書櫃及閱覽空間'],
  },
  'plis-a76458f67d7289605250': {
    url: 'https://kllib.klcg.gov.tw/cp.aspx?n=7939', facilities: ['在地、海洋及多元文化特色館藏架'],
  },
  'plis-2065ea3c3619a2597356': {
    url: 'https://kllib.klcg.gov.tw/cp.aspx?n=7932', facilities: ['圖書閱覽室', 'K 書中心'],
  },
  'plis-79f7f1447d98ee4e2917': {
    url: 'https://kllib.klcg.gov.tw/cp.aspx?n=7946',
    facilities: ['開架閱覽室', '兒童閱覽室', '閱報區', '期刊區', '新書展示區'],
  },
  'plis-d5b8a42994a660f05102': {
    url: 'https://kllib.klcg.gov.tw/cp.aspx?n=7928',
    facilities: ['K 書中心', '開架閱覽室', '兒童室', '兒童室戶外花園'],
  },
  'plis-65dcee6860c52419f419': {
    url: 'https://kllib.klcg.gov.tw/cp.aspx?n=7938', facilities: ['開放式閱覽區', '兒童區', '自修區'],
  },
  'plis-00259e7a928da5c62131': {
    url: 'https://kllib.klcg.gov.tw/cp.aspx?n=7936', facilities: ['兒童閱覽區', '一般閱覽室'],
  },
  'plis-f3080ccd8c34dad70222': {
    url: 'https://www.penghu.gov.tw/phhcc/home.jsp?id=10016',
    facilities: ['閱覽室', '書庫', '兒童室', '閱報期刊區', '資訊查詢設備', '個人視聽室'],
  },
  'plis-3762599f4dcfd24804ba': {
    url: 'https://www.phlib.nat.gov.tw/wSite/sp?mp=1&orgId=005&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    facilities: ['兒童圖書室', '閱覽室（會議室及多功能教室）', '視聽室', '展示室', '書庫',
      '期刊區', '閱報區', '參考書區', '個人視聽區', '檢索區'],
  },
  'plis-a842920d380a52665656': {
    url: 'https://www.phlib.nat.gov.tw/wSite/sp?ctNode=6218&mp=1&orgId=004&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    facilities: ['書庫', '兒童室', '期刊室', '視聽室', '公共上網電腦'],
  },
  'plis-838b908932f56e7b1d22': {
    url: 'https://matsucc.gov.tw/連江縣政府文化處公告/',
    facilities: ['兒童閱覽區'],
  },
  'plis-0f447bbe2c470b97e41a': {
    url: 'https://matsucc.gov.tw/莒光鄉圖書館-東莒分館/',
    facilities: ['電腦檢索區', '期刊及閱覽區（12 席）', '兒童區', '影印設備'],
  },
  'plis-f37b49d54805d1b961ae': {
    url: 'https://matsucc.gov.tw/北竿鄉圖書館/',
    facilities: ['報紙雜誌閱覽區', '網路資訊檢索區', '兒童閱讀區', '開放式書庫閱讀區', '影片視聽區', '個人研究區'],
  },
  'plis-7ef0c1dc2c3fc0c85b29': {
    url: 'https://matsucc.gov.tw/東引鄉圖書館/',
    facilities: ['公共上網電腦'],
  },
  'plis-cceeef12e0bfff59593f': {
    url: 'https://www.matsu-news.gov.tw/news/article/70424',
    facilities: ['兒童閱覽區', '影音暨網路資料查詢區', '期刊資料區', '館藏特色區'],
  },
  'plis-12cb176cd411e9d41770': {
    url: 'https://hcplibrary.hchcc.gov.tw/wSite/sp?idPath=4292_4295&mp=1&orgId=012&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    facilities: ['開架書庫', '鄉土文獻區', '兒童閱讀區', '藝文走廊'],
  },
  'plis-6f3ad22dfc7825bfbbe5': {
    url: 'https://hcplibrary.hchcc.gov.tw/wSite/sp?idPath=4292_4295&mp=1&orgId=011&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    facilities: ['罕用書庫', '圖書室', '報紙期刊區', '閱讀區', '資料檢索區', '好書交換區'],
  },
  'plis-e2c2e5a82e7e92aa1179': {
    url: 'https://hcplibrary.hchcc.gov.tw/wSite/sp?idPath=4292_4295&mp=1&orgId=016&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    facilities: ['圖書室', '兒童室（親子共讀區）', '期刊室', 'K 書室'],
  },
  'plis-24c304d8d8fc5bc58ab9': {
    url: 'https://www.suao.gov.tw/cp.aspx?n=6676',
    facilities: ['親子閱覽區', '新書展示區', '資訊檢索區', '書報閱覽區', '書庫', '期刊雜誌區',
      '一般閱覽及活動研習區', '藝文展覽區', '海事專區'],
  },
  'plis-5c096392579b74bd371a': {
    url: 'https://jiaosi.e-land.gov.tw/cp.aspx?n=7777',
    facilities: ['報刊室', '兒童室', '新書展示區', '資訊檢索區', '書庫', '閱覽室', '特色館藏區', '參考室'],
  },
  'plis-4b6847d140ab7464db3f': {
    url: 'https://ilwct.e-land.gov.tw/cp.aspx?n=6620',
    facilities: ['兒童閱覽區', '報刊閱讀區', '青少年閱覽區', '開放式書庫', '自習區', 'DVD 視聽設備'],
  },
  'plis-9bee8536cf45c910547b': {
    url: 'https://www.sanshing.gov.tw/cp.aspx?n=5799&s=2587',
    facilities: ['兒童閱覽室', '書庫', '多功能教室', '研習教室', '電腦教室'],
  },
  'plis-cfc0b248219632f264c7': {
    url: 'https://www.e-land.gov.tw/cp.aspx?n=19023',
    facilities: ['兒童閱覽室', '2 樓多功能閱讀空間'],
  },
  'plis-462b4877085902245ddb': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000489',
    facilities: ['電腦上網專用席', '無線上網wifi'],
  },
  'plis-0f495639312343ec173e': {
    url: 'https://www.jw.gov.tw/cp.aspx?n=15005',
    facilities: ['書庫', '期刊區', '館藏特色區', '縣籍作家專區', '藝文教室', '兒童室', '親子共讀區'],
  },
  'plis-44d1777aefba3d40891b': {
    url: 'https://www.yuanshan.gov.tw/cp.aspx?n=5787',
    facilities: ['地下 1 樓民眾閱覽室', '期刊雜誌區', '兒童閱覽室', '視聽室', '書庫', '資訊研討室', '無障礙廁所'],
  },
  'plis-e3c1d8e816d9e6061a7d': {
    url: kinmenCollectionPolicy, facilities: ['南棟親子活動區', '南棟青少年閱覽室', '南棟期刊室', '南棟自修室'],
  },
  'plis-cbce401033404caad835': {
    url: kinmenCollectionPolicy, facilities: ['開架式閱覽室', '兒童館', '2 樓閱覽室', '活動講座教室'],
  },
  'plis-722d54fbc98c7dc13cc0': {
    url: kinmenCollectionPolicy, facilities: ['兒童館', '開放式閱讀室', '多功能親子桌遊館', '教室'],
  },
  'plis-387900bcde6ccbe06570': {
    url: jinshaReopening, facilities: ['幼兒與兒童閱讀區', '無障礙及親子廁所', '哺乳室', '多功能研習教室',
      '討論室', '讀者劇場', '閱讀自習室', '多元閱讀區', '音樂影音專區'],
  },
};
const nationalTaiwanWifi = 'https://www.ntl.edu.tw/wSite/ct?ctNode=3233&mp=1&xItem=7930';
const nationalTaiwanLaptopSeats: Area = {
  name: '各樓層筆電專用座位', kind: 'reading', seats: 101, slots: null, access: 'walk-in',
  equipment: { laptop: true, outlet: true, wifi: true },
  entryNote: '館方公布一樓 21 席、二樓 44 席、三樓 10 席、五樓 16 席、六樓 10 席。各區依樓層開放時間使用。',
  sources: ['https://www.ntl.edu.tw/wSite/ct?ctNode=3193&mp=1&xItem=49384', nationalTaiwanWifi],
};
const hongmeiLibrary = 'https://www.typl.gov.tw/zh-tw/About/Introduce/018';
const zhongshanLibrary = 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=9D5E05FD2EDBBA72';
const dagangLibrary = 'https://www.typl.gov.tw/zh-tw/About/Introduce/030';
const mituoSeatDirectory = 'https://www.ksml.edu.tw/lib/content/Details.aspx?Parser=1,55,565,559,,,283';
const kangzhuangLibrary = 'https://www.typl.gov.tw/zh-tw/About/Introduce/04';
const ziguanBranchGuide = 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,54,554,548';
const fugangLibrary = 'https://www.typl.gov.tw/zh-tw/About/Introduce/015';
const localAdditionalAreas: Record<string, Area | Area[] | undefined> = {
  'plis-424ebe1541690abe5b92': {
    name: '2 樓優靜倚窗閱覽區', kind: 'reading', seats: 8, slots: null, access: null, equipment: {},
    sources: ['https://www.chcg.gov.tw/TSO/Puxin/07other/main.aspx?main_id=12367'],
  },
  'plis-b4d4a98c101cbfdc3b6d': {
    name: '期刊閱報區', kind: 'reading', seats: 7, slots: null, access: null, equipment: {},
    sources: [fugangLibrary],
  },
  'plis-f1eea7fcf8a4cde646ee': {
    name: '閱覽座位', kind: 'reading', seats: 136, slots: null, access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,73,763,757'],
  },
  'plis-ba0ab6ac6ab1829d39fc': {
    name: '閱覽區', kind: 'reading', seats: 42, slots: null, access: null, equipment: {},
    sources: [ziguanBranchGuide],
  },
  'plis-3b8c4a64ab4b313ed42f': {
    name: '閱覽區', kind: 'reading', seats: 48, slots: null, access: null, equipment: {},
    sources: [ziguanBranchGuide],
  },
  'plis-3e5d2c6ce6577c063ff7': {
    name: '閱覽座位', kind: 'reading', seats: 242, slots: null, access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,51,521,515'],
  },
  'plis-9df366887a25b0673ee7': [
    { name: '閱覽區', kind: 'reading', seats: 59, slots: null, access: null, equipment: {}, sources: [kangzhuangLibrary] },
    { name: '期刊閱報區', kind: 'reading', seats: 10, slots: null, access: null, equipment: {}, sources: [kangzhuangLibrary] },
    { name: '筆電區', kind: 'reading', seats: 5, slots: null, access: null, equipment: { laptop: true }, sources: [kangzhuangLibrary] },
  ],
  'plis-2743e51569604910aa7d': {
    name: '閱覽座位', kind: 'reading', seats: 51, slots: null, access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,59,609,603'],
  },
  'plis-a0dd6959841927ca7597': {
    name: '閱覽座位', kind: 'reading', seats: 44, slots: null, access: null, equipment: {},
    sources: [mituoSeatDirectory],
  },
  'plis-3b604bb555eaf744251d': {
    name: '閱覽座位', kind: 'reading', seats: 50, slots: null, access: null, equipment: {},
    sources: [mituoSeatDirectory],
  },
  'plis-99799da6e29815c7da11': [
    { name: '1 樓一般閱覽區', kind: 'reading', seats: 12, slots: null, access: null, equipment: {}, sources: [dagangLibrary] },
    { name: '2 樓閱報區', kind: 'reading', seats: 8, slots: null, access: null, equipment: {}, sources: [dagangLibrary] },
  ],
  'plis-4a5392763b505085c4b0': [
    { name: '8 樓閱覽區', kind: 'reading', seats: 16, slots: null, access: null,
      equipment: {}, sources: [zhongshanLibrary] },
    { name: '8 樓筆記型電腦區', kind: 'reading', seats: 6, slots: null, access: null,
      equipment: { laptop: true, outlet: true }, sources: [zhongshanLibrary,
        'https://tpml.gov.taipei/News_toggle.aspx?n=B64082F5678B94B1&sms=D0034AF4F8239B65'] },
  ],
  'plis-f837393150c2835dca29': {
    name: '書刊閱覽座位', kind: 'reading', seats: 95, slots: null, access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,34,335,328'],
  },
  'plis-777d6726d52d0b28eb51': {
    name: '閱覽座位', kind: 'reading', seats: 70, slots: null, access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,38,379,372'],
  },
  'plis-539f7d3d76b9f2ee658a': {
    name: '全館閱覽座位', kind: 'reading', seats: 250, slots: null, access: null, equipment: {},
    entryNote: '全館閱覽席次包含擴館時於 4 至 6 樓新增的 160 席。',
    sources: ['https://www.cna.com.tw/postwrite/chi/444234'],
  },
  'plis-ae1d09fa9a4aa5086830': {
    name: '一般閱覽區', kind: 'reading', seats: 37, slots: null, access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,64,664,658'],
  },
  'plis-515c0f5154d80f9e4043': {
    name: '1 至 3 樓書庫閱覽區', kind: 'reading', seats: 71, slots: null, access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,74,775,768'],
  },
  'plis-7d5b8a2a5cd7961f1a5d': {
    name: '書庫閱覽座位', kind: 'reading', seats: 148, slots: null, access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,71,741,735'],
  },
  'plis-b208b8b3efcd2c80cbaa': [
    { name: '閱覽區', kind: 'reading', seats: 28, slots: null, access: null, equipment: {}, sources: [hongmeiLibrary] },
    { name: '期刊閱報區', kind: 'reading', seats: 16, slots: null, access: null, equipment: {}, sources: [hongmeiLibrary] },
    { name: '筆電區', kind: 'reading', seats: 12, slots: null, access: null, equipment: { laptop: true }, sources: [hongmeiLibrary] },
  ],
  'plis-722fa1747d59f1487f9a': {
    name: '書庫閱覽座位', kind: 'reading', seats: 114, slots: null, access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,39,389,383'],
  },
  'plis-88c4b0b28fd9dc888207': {
    name: '書庫閱覽座位', kind: 'reading', seats: 15, slots: null, access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,70,730,724'],
  },
  'plis-d624fdace694450c004a': {
    name: '1 樓閱覽座位', kind: 'reading', seats: 26, slots: null, access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,32,313,306'],
  },
  'plis-746d36c88f898d0e8c07': {
    name: '3 樓書庫區', kind: 'reading', seats: 134, slots: null, access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,43,434,427'],
  },
  'plis-06504d756c4ec047d449': {
    name: '1 樓報紙期刊區（夜間自修區）', kind: 'study',
    slots: [0, 2, 3, 4, 5, 6].map((day) => ({ day, start: minutes('09:00'), end: minutes('19:00') })),
    access: null, equipment: {},
    sources: ['https://lib.bocach.gov.tw/cp.aspx?n=1218'],
  },
  'plis-946f82daf9ca97d241ba': {
    name: '地下室閱覽區', kind: 'reading', seats: 40, slots: null, access: null, equipment: {},
    sources: ['https://hcplibrary.hchcc.gov.tw/wSite/sp?idPath=4292_4295&mp=1&orgId=010&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp'],
  },
  'plis-898020f5dd3a533a9ee3': {
    name: '臨時館閱覽區', kind: 'reading', seats: 50, slots: null, access: null, equipment: {},
    sources: ['https://library.hccc.gov.tw/ct.asp?ctNode=1051&mp=20&xItem=7450'],
  },
  'plis-efe674464e6fce8f380e': {
    name: '兒童館閱覽座位', kind: 'reading', seats: 90, slots: null, access: null, equipment: {},
    sources: ['https://library.hccc.gov.tw/sp.asp?ctNode=1025&mp=20&xItem=6890&xdurl=mp200ap%2Fbranch.asp'],
  },
  'plis-2b1932820682ee253f7e': {
    name: '樂齡館閱覽座位', kind: 'reading', seats: 35, slots: null, access: null, equipment: {},
    sources: ['https://library.hccc.gov.tw/sp.asp?ctNode=1025&mp=20&xItem=6890&xdurl=mp200ap%2Fbranch.asp'],
  },
  'plis-4f772c9702962d95b0f8': {
    name: '閱覽區', kind: 'reading', seats: 32, slots: null, access: null, equipment: {},
    sources: ['https://www.typl.gov.tw/zh-tw/About/Introduce/029'],
  },
  'plis-793de43144ebd1a7578c': {
    name: '閱覽區', kind: 'reading', seats: 36,
    slots: [0, 2, 3, 4, 5, 6].map((day) => ({ day, start: minutes('09:00'), end: minutes('17:00') })),
    access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,42,422,416'],
  },
  'plis-3d9a951164210abf4cb8': {
    name: '期刊區', kind: 'reading', seats: 18, slots: null, access: null,
    equipment: {}, entryNote: '期刊區為沙發座位。電腦使用區另有 4 席，幼兒閱覽區可供 30 人以上親子共讀。',
    sources: ['https://www.mlvillage.gov.tw/content/index.aspx?Parser=1,4,153,31'],
  },
  'plis-a908448b0b36ed1715ce': {
    name: '5 樓書庫閱覽區', kind: 'reading', seats: 24,
    slots: [0, 2, 3, 4, 5, 6].map((day) => ({ day, start: minutes('09:00'), end: minutes('17:00') })),
    access: null, equipment: {},
    sources: ['https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,41,411,405',
      'https://youth.ksml.edu.tw/content/index?Parser=1,4,45,26'],
  },
  'plis-fe9c622fb1bdd5279ec1': {
    name: '2 樓閱覽區', kind: 'reading', seats: 20,
    slots: [0, 3, 4, 5, 6].flatMap((day) => [
      { day, start: minutes('08:30'), end: minutes('12:00') },
      { day, start: minutes('13:30'), end: minutes('17:00') },
    ]),
    access: 'walk-in', equipment: {},
    entryNote: '開館時可自由入館閱覽，未滿 6 歲須由家長陪同。1 樓期刊區另有 10 個沙發座位，視聽區另設座位。',
    sources: ['https://matsucc.gov.tw/莒光鄉圖書館/'],
  },
  'plis-8e698a4770cf01e3875e': {
    name: '1 樓期刊閱報區', kind: 'reading', seats: 80,
    slots: [0, 2, 3, 4, 5, 6].map((day) => ({
      day, start: minutes('08:30'), end: minutes(day === 0 ? '17:00' : '20:30'),
    })),
    access: 'conditional', equipment: {},
    entryNote: '供閱覽館內報紙與期刊。禁止自修或閱讀個人書籍、資料，未滿 6 歲不得入內。',
    sources: ['https://www.nthcc.gov.tw/A7_2/content/127'],
  },
  'plis-cf8f59d429a9ca2188f7': {
    name: '1 樓閱覽區', kind: 'reading', seats: 36, slots: null, access: null,
    equipment: {}, sources: [qionglinLibrary],
  },
  'plis-0d08a9f889b9abeca093': {
    name: '2 至 3 樓閱覽區', kind: 'reading', seats: 240,
    slots: [0, 2, 3, 4, 5, 6].map((day) => ({ day, start: minutes('08:00'), end: minutes('17:00') })),
    access: null, equipment: {},
    sources: ['https://hcplibrary.hchcc.gov.tw/wSite/sp?orgId=006&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp'],
  },
  'plis-e9169e5ae78a7cac791b': {
    name: '3 樓一般閱覽區', kind: 'reading', seats: 49, slots: null, access: null,
    equipment: {}, entryNote: '同樓層另有期刊區 24 席、兒童室 21 席。',
    sources: ['https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=E00BDD309B7F8D33&sms=CFFFC938B352678A'],
  },
  'plis-372455894f315cbbad48': {
    name: '5 樓一般閱覽區', kind: 'reading', seats: 80, slots: null, access: null,
    equipment: {}, entryNote: '4 樓兒童閱覽區另有 39 席。',
    sources: ['https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=6B2D15D39F90119B&sms=CFFFC938B352678A'],
  },
  'plis-52b31760b5c01701738f': {
    name: '3 樓一般閱覽區', kind: 'reading', seats: 94, slots: null, access: null,
    equipment: { laptop: true, outlet: true, wifi: true },
    sources: ['https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=87666d0966844572bc4bf24c9f706ed4'],
  },
  'plis-a094b0d4aa7d7722fd03': {
    name: '3 樓行動裝置座位區', kind: 'reading', seats: 50,
    slots: [0, 2, 3, 4, 5, 6].map((day) => ({ day, start: minutes('08:00'), end: minutes('21:00') })),
    access: 'card', regionalCard: 'nationalTaiwan', reservation: 'https://ireserve.ntl.edu.tw/sm/home_web.do',
    entryNote: '從中和門入館，持本人國立臺灣圖書館借閱證或悠遊卡借閱證登記。25 席可線上預約，25 席限現場登記。限使用筆電、平板或手機的讀者。',
    equipment: { laptop: true, outlet: true, wifi: true },
    sources: ['https://www.ntl.edu.tw/wSite/ct?ctNode=3195&mp=1&xItem=87056',
      'https://www.ntl.edu.tw/wSite/ct?ctNode=1711&mp=1&xItem=58536', nationalTaiwanWifi],
  },
  'plis-116d6ca137065aaf1b89': {
    name: '3 樓筆記型電腦區', kind: 'reading', seats: 8, slots: null, access: null,
    equipment: { laptop: true, wifi: true },
    sources: ['https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=a889c808b3c0413a88347eeabbecffca'],
  },
  'plis-b5812bfda43fbd06e2a4': {
    name: '6 樓筆電區', kind: 'reading', seats: 12, slots: null, access: null,
    equipment: { laptop: true, wifi: true, outlet: true },
    sources: ['https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=e57e1d4b92334b029508f25dc38c4a39'],
  },
  'plis-328bb20a01970d84f947': {
    name: '7 樓筆電區', kind: 'reading', seats: 8, slots: null, access: null,
    equipment: { laptop: true, wifi: true, outlet: true },
    sources: ['https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=2ba325ce4a9a497faf1090779e598b2f'],
  },
  'plis-5b5fc3a61599de8068a6': {
    name: '吧檯筆電區', kind: 'reading', seats: 14, slots: null, access: null,
    equipment: { laptop: true, wifi: true, outlet: true },
    sources: ['https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=1096d82768304ebf8d5a14a403a535e0'],
  },
  'plis-058be989d22b992c5b8a': {
    name: '1 樓資訊檢索與數位資源區筆電席', kind: 'reading', seats: 8, slots: null, access: null,
    equipment: { laptop: true, outlet: true },
    sources: ['https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=099812be491c45e59238adcaf69d3443'],
  },
  'plis-cbce401033404caad835': {
    name: '2 樓閱覽室', kind: 'reading', slots: null, access: null, equipment: {}, sources: [kinmenCollectionPolicy],
  },
  'plis-722d54fbc98c7dc13cc0': {
    name: '1 樓開放式閱讀室', kind: 'reading', slots: null, access: null, equipment: {}, sources: [kinmenCollectionPolicy],
  },
};
const newTaipeiEquipmentWork = {
  url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=1543977c02c848e185486a90c2104f2d',
  note: '2026 年 11 月 17 日至 12 月 9 日進行公共安全設備汰換，施工期間可能有噪音及異味。',
};
const serviceUpdates: Record<string, { url: string; note: string } | undefined> = {
  'plis-b4d4a98c101cbfdc3b6d': {
    url: fugangLibrary,
    note: '兒童閱覽區約 12 席，視聽資料播放區有 9 席。',
  },
  'plis-01e95280aebec7eba09c': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/017',
    note: '期刊閱報區約 20 席、兒童閱覽區約 15 席，另有視聽資料播放區 2 席及約可容納 18 人的研習教室。',
  },
  'plis-5f74f02b42c06b3fc9d9': {
    url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/016',
    note: '閱報區約 20 席、兒童閱覽區約 15 席。',
  },
  'plis-9df366887a25b0673ee7': {
    url: kangzhuangLibrary,
    note: '館內另有上網區 10 席。',
  },
  'plis-07432e289be30af20610': {
    url: 'https://www.ksml.edu.tw/LibNews/Details.aspx?Parser=9,4,925,,,,16250',
    note: '館舍於 2026 年 9 月 1 日重新開館。',
  },
  'plis-5214bc11151c1cde5bf4': {
    url: 'https://www.mlcg.gov.tw/News_Content.aspx?n=2546&s=1004067',
    note: '市公所公告工程預計 2027 年 5 月竣工、7 月正式開館，實際復館日期依後續公告。',
  },
  'plis-ae1d09fa9a4aa5086830': {
    url: 'https://www.ksml.edu.tw/mainlibrary/Latestevent/Details.aspx?Parser=9,23,212,157,,,15337,,,,4',
    note: '耐震補強工程完成，已於 2026 年 11 月 7 日重新開館。',
  },
  'plis-bfff639f154e1c065ad1': {
    url: 'https://www.cna.com.tw/postwrite/chi/448992',
    note: '館舍完成整修，於 2026 年 11 月 4 日重新開館，設有親子共讀區及多元閱讀空間。',
  },
  'plis-b208b8b3efcd2c80cbaa': {
    url: hongmeiLibrary,
    note: '上網電腦區有 12 席，視聽資料播放區有 6 席，可透過觸控式座位管理系統登記及報到。',
  },
  'plis-285a909321403c65e3d5': {
    url: 'https://www.tnpl.tn.edu.tw/u5364522661977750278/a1',
    note: '館內提供免費無線網路，也可自備筆電上網。自修室內的網路與筆電使用規定請向館方確認。',
  },
  'plis-0d8617adcdaa013618d9': {
    url: 'https://www.typl.gov.tw/zh-tw/News/Content/3366',
    note: '館方 2026 年 11 月 14 日公告因漏水檢修，2 樓 B 側及該區廁所、1 樓無障礙廁所暫停開放。恢復日期依館方公告，無障礙廁所使用需求可洽服務臺。',
  },
  'plis-114080cf8fa32977d08a': {
    url: 'https://doit.gov.taipei/News_Content.aspx?n=E3D88B653EACBF6E&s=4A1259C6B21F2AA5&sms=78D644F2755ACCAA',
    note: '整修期間至 2026 年 12 月 14 日，3 樓圖書與閱覽區、4 樓視聽室及樂齡學習中心暫停開放。3 樓館藏可線上預約到館取書。',
  },
  'plis-a2f0f325a9d82ca850f0': {
    url: 'https://www.library.ntpc.gov.tw/singlehtml/ActvInfo?cntId=46cff6829c18462fadbd5e49dccbea78',
    note: '原館 3 樓自修室自 2026 年 5 月 27 日起因拆遷準備停止開放。',
  },
  'plis-5ca7b8662f3ee724afdb': newTaipeiEquipmentWork,
  'plis-b3b132289aafe42b7431': newTaipeiEquipmentWork,
  'plis-45e2769173fd5cf565ff': newTaipeiEquipmentWork,
  'plis-2fcff6be9344e712594c': {
    url: 'https://www.cna.com.tw/news/aloc/202609210263.aspx',
    note: '依文化局公布的搬遷安排，化龍一村兒少書房自 2026 年 10 月 12 日閉館，樂齡書房自 11 月 16 日閉館。新總館 B 館預計 12 月 20 日試營運，實際開放時間依館方公告。',
  },
  'plis-e05db638ff1f09f7be82': {
    url: 'https://files.chcg.gov.tw/files/68_20250407115710143_彰化縣福興鄉立圖書館借閱規定.pdf',
    note: '館方借閱規定指出，館內座位供閱覽館藏使用，請勿佔位自修。',
  },
  'plis-50a85fd5bd2678f089ba': {
    url: 'https://www.cultural.pthg.gov.tw/library/cp.aspx?n=CDFE6D1C65C796B9&s=E90637FFE06B2379',
    note: '縣府館舍頁列有一樓自修室，國家圖書館館別統計列為無自修室。現況與使用時段請洽館方。',
  },
  'plis-38c1c05b0d447cb39563': {
    url: 'https://www.library.ntpc.gov.tw/Kids/singlehtml/2282e79138184d328d2e70de42f23318?cntId=-1534781038',
    note: '2026 年 11 月 17 日視聽資料區木作地板範圍暫停開放，其餘空間照常開放。',
  },
  'plis-aa077d31f651076b59ef': {
    url: yuminCleaning,
    note: '地板清潔期間，2026 年 11 月 9 日 5 樓（含自修室）暫停開放，11 月 30 日 4 樓暫停開放。兩天流通櫃檯照常服務。',
  },
  'plis-a382f4004c63510e6b53': {
    url: minxiongRenovation,
    note: '整修期間 1 樓及閱報室暫停開放，請走側樓梯。借還書及領取預約書請至 3 樓櫃檯。',
  },
  'plis-d34887b8b49b91a79656': {
    url: nantouEarlyReading,
    note: '原館拆除後，臨時館設於愛國社區活動中心。地圖標示活動中心位置。到館前請致電 049-2791534 確認開放情形。',
  },
  'plis-71debe76739635a0cacc': {
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000450',
    note: '原館拆除重建期間，請前往箕湖臨時圖書館（民眾路 39-1 號）。臨時館自 2026 年 1 月 3 日起營運。',
  },
  'plis-645a77676fc64f962dcf': {
    url: 'https://www.ncyu.edu.tw/ncyu/Subject/Detail/239895?nodeId=835',
    note: '臨時閱覽室：湖內里活動中心 A 棟 2 樓（湖子內路 172 號）週二至週日 09:00–17:00。嘉義大學林森校區 E 棟 1 樓 E103、E105（林森東路 151 號）週二至週六 09:00–20:00、週日 09:00–17:00。兩處週一及國定假日休息。',
  },
  'plis-66fa0a939c2eddc2cbeb': {
    url: 'https://web.tainan.gov.tw/ysdo/News_Content.aspx?n=8385&s=8846323&sms=11449',
    note: '2026 年 11 月 17 日至 20 日搬遷期間全館暫停服務，11 月 21 日回到月津路 14 之 1 號原館。',
  },
  'plis-ccd76885634412ccaa4a': {
    url: 'https://www.ntpc.gov.tw/ch/home.jsp?dataserno=aa076d144bbfd6d2d0821e90527ecc28&id=e8ca970cde5c00e1',
    note: '三芝分館「自然書室」於 2026 年 11 月 3 日在淡金路一段 37 號原址正式啟用。',
  },
  'plis-f5672c9a38fabba9eabb': {
    url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=90269135cd3b46ccac221df193f78e60',
    note: '2026 年 11 月 16 日起原館停止館藏外借，保留預約取書、還書、辦證及期刊報紙閱覽。',
  },
  'plis-f84b77b25e9ffc2013e9': {
    url: 'https://www.tnpl.tn.edu.tw/n15459485893940237436/n1Content',
    note: '原館施工延長至 2027 年 1 月 25 日。社教中心 A 棟 1 樓臨時櫃檯提供預約取書、還書、續借及辦證。週二至週五 08:30–20:30、週六至週日 09:00–16:30，週一及國定假日休息。',
  },
  'plis-e94c48945a092b5818d8': {
    url: 'https://hcplibrary.hchcc.gov.tw/wSite/ct?ctNode=4293&mp=1&xItem=11048',
    note: '縣政九路館各樓層已恢復開放。自 9 月 12 日起暫停館內調閱、超商借書、贈書及好書交換，自 10 月 20 日起暫停受理指定本館為取書館的新預約。',
  },
  'plis-e3c1d8e816d9e6061a7d': {
    url: 'https://www.kmdn.gov.tw/1117/1271/1272/590112/',
    note: '北棟自 2026 年 9 月 15 日起整修暫停開放，南棟持續服務。',
  },
};
const keelungExtendedHours = {
  url: 'https://kllib.klcg.gov.tw/News_Content.aspx?n=8243&s=16436',
  hours: '週二至週六 09:00–21:00，週日 09:00–17:00。週一及國定假日休館，閉館前 30 分鐘停止辦證及借還書。',
  supersedesDirectory: true,
} as const;
const localHours: Record<string, { url: string; hours: string; studyRoom?: boolean; supersedesDirectory?: true } | undefined> = {
  'plis-a842920d380a52665656': {
    url: 'https://www.phlib.nat.gov.tw/wSite/sp?mp=1&orgId=004&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    hours: '週三至週日 08:15–12:00、13:30–17:30。週三至週五加開 19:00–21:00，2、7、8 月晚間加開擴及週六及週日。週一、週二及國定假日休館。',
    supersedesDirectory: true,
  },
  'plis-bfff639f154e1c065ad1': {
    url: 'https://www.cycab.gov.tw/wSite/sp?idPath=5217_5222_5236&mp=1&orgId=016&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    hours: '週二至週六 08:00–17:00。週日 08:00–17:00，縣府各館時段表列週日 12:00–13:00 休息，午間到館前請先確認。',
    supersedesDirectory: true,
  },
  'plis-c9c0fe185180d1def859': {
    url: 'https://www.guanshan.gov.tw/about/about4',
    hours: '週二至週日 08:00–12:00、13:00–17:00，週一休館。特殊日期依館方公告。',
    supersedesDirectory: true,
  },
  'plis-41bce5bf027121bcb9e9': {
    url: 'https://www.ttjfng.gov.tw/home/images/download/rules-stra/1150126.pdf',
    hours: '週一至週五 08:30–12:00、13:30–17:30。政府公告放假日及鄉內重大慶典活動期間休館。',
    supersedesDirectory: true,
  },
  'plis-de863fe06ace49835a69': {
    url: 'https://www.cycab.gov.tw/wSite/sp?idPath=5217_5222_5236&mp=1&orgId=003&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    hours: '館方頁面仍列原館整修。臨時借還書服務在嘉檳文化館（中埔村 128 之 8 號），週一至週五 09:00–18:00。原館復館時間待館方確認。',
    supersedesDirectory: true,
  },
  'plis-24d66dc05128f8f7593d': {
    url: 'https://www.cycab.gov.tw/wSite/sp?idPath=5217_5222_5236&mp=1&orgId=002&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    hours: '週二至週五 08:00–12:00、13:00–17:00，週六及週日 08:00–17:00。週一及國定假日休館，每月 20 日清館安排依館方公告。',
    supersedesDirectory: true,
  },
  'plis-3a8fa4c8db9589758aef': {
    url: 'https://www.cycab.gov.tw/wSite/sp?idPath=5217_5222_5236&mp=1&orgId=011&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    hours: '週二至週五 08:00–17:00，週六及週日 08:00–16:00。週一、國定假日及選舉日休館。',
    supersedesDirectory: true,
  },
  'plis-708a19a863b754e58e04': {
    url: sanwanLibraryHours,
    hours: '週一至週日 08:00–17:00。農曆春節及選舉日休館。',
    supersedesDirectory: true,
  },
  'plis-27e5ed75c8013b01c228': {
    url: tainanTuchengUrl,
    hours: '週三至週日 09:00–20:00。週二及每月最後一個週五 09:00–17:00 僅提供預約書取書。週一及國定假日休館。',
    supersedesDirectory: true,
  },
  'plis-ca5bd98a9d6dcfd1159b': {
    url: 'https://cabkc.kinmen.gov.tw/information?pid=22&uid=9',
    hours: '週一至週日 08:00–12:00、13:30–17:30。四大民俗節日休館。',
    supersedesDirectory: true,
  },
  'plis-7ef0c1dc2c3fc0c85b29': {
    url: 'https://www.dongyin.gov.tw/Chhtml/content/2503',
    hours: '週一至週五 08:00–12:00、13:30–17:30，週六、週日及國定假日休館。',
    supersedesDirectory: true,
  },
  'plis-47d9eb53677ef9688a15': {
    url: 'https://www.nlpi.edu.tw/LibraryInfo/libraryinfo?PageType=1&id=7e95d643-5fb0-442e-96a0-f22f9b0fb151&pageIndex=1',
    hours: '週二至週六：期刊閱報室及自修室 09:00–21:00、書庫 09:00–20:00、兒童閱覽室 09:00–18:00。週日 09:00–17:00，週一及政府公告放假日休館。',
    supersedesDirectory: true,
  },
  'plis-05da96e29ca78b9de81a': {
    url: fuxingLibraryServices,
    hours: '區公所公告週二至週六 09:00–17:00，週日、週一及國定假日休館。',
    studyRoom: true,
    supersedesDirectory: true,
  },
  'plis-a382f4004c63510e6b53': {
    url: minxiongRenovation,
    hours: '自 2026 年 11 月 3 日起整修。2 樓自修室週二至週五 08:00–20:00、週六 08:00–17:00、週日 08:00–16:00。3 樓週二至週六 08:00–17:00、週日 08:00–16:00。4 樓週二至週六 09:00–17:00。預計 2027 年 2 月底重新開館，日期依館方公告。',
    studyRoom: true, supersedesDirectory: true,
  },
  'plis-7417038e0db9b35c62ea': {
    url: 'https://www.houlong.gov.tw/cp.aspx?n=4134',
    hours: '週二至週日 08:00–17:00。週一、國定假日及選舉日休館。',
    supersedesDirectory: true,
  },
  'plis-2efbf4bcfe8e68151f65': keelungExtendedHours,
  'plis-fb0648ec4fff7472b345': keelungExtendedHours,
  'plis-a76458f67d7289605250': keelungExtendedHours,
  'plis-2065ea3c3619a2597356': keelungExtendedHours,
  'plis-79f7f1447d98ee4e2917': keelungExtendedHours,
  'plis-00259e7a928da5c62131': {
    url: 'https://kllib.klcg.gov.tw/News_Content.aspx?n=8243&s=18229&sms=12762',
    hours: '自 2026 年 8 月 16 日起，週二至週六 09:00–17:00，週日及週一休館。國定假日休館，閉館前 30 分鐘停止借還書。',
    supersedesDirectory: true,
  },
  'plis-0f495639312343ec173e': {
    url: 'https://www.jw.gov.tw/cp.aspx?n=15005',
    hours: '週二至週日 08:30–17:00。週一及國定假日休館。每月最後一日為清潔日，遇週六、週日或週一則提前至週五休館。',
    supersedesDirectory: true,
  },
  'plis-3428641ec78aeb601979': {
    url: 'https://www.tnpl.tn.edu.tw/Page/EachPavilionIndex.aspx?id=u4903210577041037183',
    hours: '週二至週五 08:00–20:00，週六及週日 08:00–17:00。週一及國定假日休館，月末週五清潔日 13:00–20:00 開館。',
    supersedesDirectory: true,
  },
  'plis-0c2ace2641b37f2a19ac': {
    url: 'https://www.tnpl.tn.edu.tw/Page/EachPavilionIndex.aspx?id=u5211120801450367947',
    hours: '週二至週五 08:00–20:00，週六及週日 08:00–17:00。週一及國定假日休館，流通櫃台提前 30 分鐘停止服務。',
    supersedesDirectory: true,
  },
  'plis-dd0e38aa18f750ffcade': {
    url: 'https://www.typl.gov.tw/zh-tw/News/Content/3345',
    hours: '原館自 2026 年 5 月 11 日起整修。臨時營運所自 10 月 30 日起移至 1 樓原閱報區，週二至週六 08:30–18:00、週日及週一 08:30–17:00，國定假日及每月最後一個星期四休息。',
    studyRoom: false, supersedesDirectory: true,
  },
  'plis-d9870072fabe0dbffb74': {
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=5e4f32adbc9247199415370f12f3326a',
    hours: '原館自 2026 年 6 月 25 日起閉館整修。復興綜合大樓 1 樓臨時服務據點週二至週六 09:00–21:00，週日及週一 09:00–17:00，國定假日休息。',
    studyRoom: false, supersedesDirectory: true,
  },
  'plis-851a10bc58bf5f5c6fcb': {
    url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=2ac534a25d4f41e292b4db4f43b8197e',
    hours: '原館自 2026 年 6 月 1 日起閉館重建。文化路一段 18 號 1 樓臨時據點提供預約取書、還書及辦證。',
    studyRoom: false, supersedesDirectory: true,
  },
  'plis-b7a50b9284256d36bef0': {
    url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=14E9915FB92D566E',
    hours: '臨時替代服務處提供還書、預約取書、繳費及辦證。週二至週六 10:00–19:30，週日及週一 10:00–17:00。每月第一個星期四、最後一個星期一及國定假日休館。',
    studyRoom: false, supersedesDirectory: true,
  },
  'plis-6340f6e59e0e98e1adb1': {
    url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=54ea2029a140446bb5af6b98567a6c8c',
    hours: '原閱覽室整修。2 樓臨時櫃檯提供預約取書及還書，週二至週六 08:30–21:00，週日及週一 08:30–17:00，國定假日休息。',
    studyRoom: false, supersedesDirectory: true,
  },
  'plis-a2f0f325a9d82ca850f0': {
    url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=fa1681781d5841f1a4395b90373a6e2b',
    hours: '原館自 2026 年 6 月 1 日起閉館重建。光興閱覽室的臨時櫃檯提供預約取書及還書，週二至週六 09:00–21:00，週日 09:00–17:00，週一休息。',
    studyRoom: false, supersedesDirectory: true,
  },
  'plis-80f92b0a929540e08c5d': {
    url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=eba9e12b822f4ee2ae96225f4546bdba',
    hours: '原館耐震補強。捷運永安市場站 2 樓臨時服務閱覽室每日 09:00–17:00，每月第一個週一及國定假日休息。',
    studyRoom: false, supersedesDirectory: true,
  },
  'plis-e2c2e5a82e7e92aa1179': {
    url: 'https://hcplibrary.hchcc.gov.tw/wSite/sp?orgId=016&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    hours: '福德分館週二至週五 09:00–20:30，週末 09:00–17:00，週一及國定假日休館。',
    supersedesDirectory: true,
  },
  'plis-838b908932f56e7b1d22': {
    url: 'https://www.nankan.gov.tw/chhtml/Detail/2221?mcid=92857',
    hours: '週一及週三至週日 09:00–17:00。週二休館。',
    supersedesDirectory: true,
    studyRoom: true,
  },
  'plis-f3080ccd8c34dad70222': {
    url: 'https://www.penghu.gov.tw/phhcc/home.jsp?id=67',
    hours: '書庫、兒童室、期刊區及視聽室週三至週日 09:00–21:00。讀者自修室週一、週二 08:30–17:30，週三至週日 08:30–21:00。自修室於國定假日及每月最後一個星期二休館。',
    supersedesDirectory: true,
  },
  'plis-1d71cbf4cd1d410256ad': {
    url: 'https://www.ji-an.gov.tw/library/data/5?cate=14',
    hours: '依吉安鄉立圖書館官網，週三至週五 08:30–20:30，週二、週六及週日 08:30–17:00。週一及國定紀念日休館。',
    supersedesDirectory: true,
  },
  'plis-898020f5dd3a533a9ee3': {
    url: 'https://library.hccc.gov.tw/sp.asp?ctNode=930&mp=20&xItem=6889&xdurl=mp200ap%2Fbranch.asp',
    hours: '臨時館位於文化局園區演藝堂地下 1 樓。週二至週五 09:00–20:00，週末 09:00–18:00。週一及國定假日休館。',
    supersedesDirectory: true,
  },
  'plis-f115f1f71be7cccd30e1': {
    url: xinyuanUrl,
    hours: xinyuanHours + ' 縣府館舍頁註明二樓樓梯有安全疑慮，目前只開放一樓，二樓自修閱讀區暫停使用。',
    supersedesDirectory: true,
  },
  'plis-674920ab9a5621eaf6cf': {
    url: 'https://www.cna.com.tw/postwrite/chi/431519',
    hours: '週二至週日 09:00–21:00。週末館藏區開放至 17:30。週一、國定假日及每月最後一日休館。',
    studyRoom: true,
    supersedesDirectory: true,
  },
  'plis-3dc026b916c043fe287e': {
    url: 'https://www.changkang.gov.tw/news/news1/detail/9834',
    hours: '自 2026 年 11 月 9 日起，整修期間閱覽區週二至週日 08:00–17:00，暫停借閱。週一及國定假日休館。每月最後一日清館，遇週一、國定假日或例假日提前或順延一日。',
    supersedesDirectory: true,
  },
  'plis-6c9e30dc1c6abf7a17d4': {
    url: 'https://kllib.klcg.gov.tw/cp.aspx?n=7933',
    hours: '週二至週六 09:00–21:00，週日 09:00–17:00。週一及國定假日休館。',
    studyRoom: true,
  },
  'plis-29ea3972b0a938ef5d16': {
    url: 'https://library.hccg.gov.tw/chhcml/app/digital/view?id=55&module=branchLibrary&serno=ad675c74-33d4-4c43-b6cc-e1ee7b55dc50',
    hours: '週二至週日 09:00–17:00。週一、選舉日及館方公告的民俗節日休館。',
  },
  'plis-27e42cf8f073cee7c04f': {
    url: 'https://www.library.taichung.gov.tw/lib/content/index?Parser=1,108,630',
    hours: '週二至週六 08:30–21:00，週日 08:30–17:30。週一及國定假日休館。',
  },
  'plis-a141c3b5fc0e2accfd60': {
    url: 'https://www.cycab.gov.tw/wSite/sp?idPath=5217_5222_5236&mp=1&orgId=017&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
    hours: '週一至週五 08:00–12:00、13:00–17:00。週六、週日及國定假日休館。',
  },
};
const hsinchuHoursOverride = {
  url: 'https://library.hccg.gov.tw/chhcml/app/data/view?id=18&module=userTerm&serno=b39fff74-7075-46ee-85c5-dee460b6f208',
  hours: '週二至週五 09:00–21:00，週六及週日 09:00–17:00。假日異動依館方公告。',
};

const comparableAddress = (value: string) => value.normalize('NFKC').replaceAll('台', '臺')
  .trim().replace(/^\d{3,6}(?=\s*\D)/, '').replace(/\s/g, '');

const hsinchuOpening = 'https://www.hclibraryopening.com.tw/';
const hsinchuFloorGuide = 'https://www.hclibraryopening.com.tw/%E8%AA%8D%E8%AD%98%E7%B8%BD%E5%9C%96';
const stellarSpace = 'https://www.ftvnews.com.tw/news/detail/2026B12W0750';
const stellarOpening = 'https://hcplibrary.hchcc.gov.tw/wSite/ct?ctNode=4293&mp=1&xItem=11078';
const pudingOpening = 'https://news.tycg.gov.tw/News_Content.aspx?n=5016&s=1935304';
const taoyuanOpeningHours = 'https://www.tycg.gov.tw/News_Content.aspx?n=97&s=1554331';
const taoyuanSeatPortal = 'https://spaceme.typl.gov.tw/';
const taoyuanSeatRules = 'https://www.typl.gov.tw/zh-tw/Reader/RegulationContent/6';
const iTaiwanHotspots = 'https://itaiwan.gov.tw/ftp/upload/HotspotData/hotspotlist_tw.csv';
const hsinchuNandaContact = 'https://dgservice.hccg.gov.tw/serviceNotice.do?id=1329&rule=guest';
const hsinchuNandaOpening = 'https://www.cna.com.tw/postwrite/chi/448883';
const hsinchuReadingOnly = new Set([
  'plis-8ec15d072d689e24a3b1', 'plis-29ea3972b0a938ef5d16', 'plis-adffc7dba798fd30e8ad',
  'plis-eabbc6fc8f182c08456f', 'plis-f31c4a951eb1511451a0',
]);
const hsinchuReadingServices = 'https://library.hccg.gov.tw/chhcml/app/artwebsite?id=42&module=artwebsite&serno=null';
const hengchunFolkLibrary = 'https://www.cna.com.tw/postwrite/chi/374040';
const announcedLibraries: (Library & { city: string })[] = [
  {
    id: 'local-pingtung-hengchun-folk-library', name: '恆春文化中心民謠館圖書館', city: '屏東縣', district: '恆春鎮',
    address: '屏東縣恆春鎮東門路一巷6號', phone: '08-8891688', types: ['公共圖書館'],
    website: 'https://www.cultural.pthg.gov.tw/cp.aspx?n=258BE29D0243BCF6',
    sources: [hengchunFolkLibrary, 'https://spotlightaward.taiwan.net.tw/tourpage.php?id=13271014-c010-486d-9889-56308c2558c1&tag=3',
      'https://www.i-pingtung.com/pingtung/view/恆春文化中心民謠館', 'https://maps.app.goo.gl/Q5M61DnPKbuShK1Y7'],
    coordinates: { latitude: 22.0035682, longitude: 120.7494557 },
    openingHours: '民謠館週二至週四及週日 09:00–18:00，週五至週六 09:00–21:00，週一休館。',
    facilities: ['主題圖書館', '親子閱讀區', '自修空間'],
    accessNote: '主題圖書館位於民謠館 2、3 樓，親子閱讀與自修空間合計近 100 席。',
    studyRoom: true,
    areas: [{ name: '自修空間', kind: 'study', slots: null, access: null, equipment: {}, sources: [hengchunFolkLibrary] }],
    closures: [],
  },
  {
    id: 'local-hsinchu-city-nanda', name: '新竹市圖書館南大分館', city: '新竹市', district: '東區',
    address: '新竹市東區南大路521號', phone: '03-5619962', types: ['公共圖書館'],
    website: hsinchuNandaOpening, sources: [hsinchuNandaOpening, hsinchuNandaContact, 'https://www.openstreetmap.org/way/291042237', iTaiwanHotspots],
    coordinates: { latitude: 24.79408, longitude: 120.96555 },
    facilities: ['文獻資料專區', '兒童閱覽區', '藝文展區', '多功能室', '無線上網wifi'],
    accessNote: '2026 年 11 月 3 日正式開館，館方公布 100 席閱覽座位。',
    areas: [{ name: '館內閱覽座位', kind: 'reading', slots: null, access: 'walk-in', seats: 100,
      equipment: {}, sources: [hsinchuNandaOpening] }], closures: [],
  },
  {
    id: 'local-taoyuan-puding', name: '桃園市立圖書館埔頂分館', city: '桃園市', district: '大溪區',
    address: '桃園市大溪區埔仁路555號', phone: '03-3072254', types: ['公共圖書館'], website: pudingOpening,
    coordinates: { latitude: 24.90865, longitude: 121.2834 },
    openingHours: '週二至週六 08:30–21:00，週日及週一 08:30–17:00。國定假日及每月最後一個星期四休館，以館方公告為準。',
    sources: [pudingOpening, 'https://www.tycg.gov.tw/NewsPage.aspx?n=9&sms=9881',
      'https://www.typl.gov.tw/zh-tw/Closed/Today', taoyuanOpeningHours, 'https://www.openstreetmap.org/way/264105961'],
    studyRoom: true, facilities: ['親子閱覽區', '一般閱覽室', '研習教室', '自修閱覽座位'],
    areas: [{ name: '自修閱覽區', kind: 'study', access: 'card', regionalCard: 'taoyuan', seats: 93,
      reservation: taoyuanSeatPortal,
      entryNote: '持桃園市圖個人借閱證或市民卡登記。座位系統列 76 席當日席、17 席預約席。',
      slots: Array.from({ length: 7 }, (_, day) => ({
        day, start: minutes('08:30'), end: minutes(day <= 1 ? '17:00' : '21:00'),
      })),
      equipment: {}, sources: [pudingOpening, taoyuanOpeningHours, taoyuanSeatRules, taoyuanSeatPortal] }],
    closures: [
      { from: '2026-11-28', until: '2026-11-28', reason: '地方公職人員選舉日休館',
        url: 'https://www.typl.gov.tw/zh-tw/Closed/Content/90' },
      ...['2026-11-26', '2026-12-31'].map((date) => ({
        from: date, until: date, reason: '圖書整理清館日休館', url: taoyuanOpeningHours,
      })),
    ],
  },
  {
    id: 'local-hsinchu-county-main', name: '新竹縣立總圖書館', city: '新竹縣', district: '竹北市',
    address: '新竹縣竹北市自強三路155號', types: ['公共圖書館'],
    coordinates: { latitude: 24.81503, longitude: 121.01758 },
    phone: '03-658-8139',
    website: hsinchuOpening, sources: [hsinchuOpening, hsinchuFloorGuide,
      'https://hcplibrary.hchcc.gov.tw/wSite/ct?ctNode=4293&mp=1&xItem=11074', 'https://www.openstreetmap.org/relation/17509614'],
    openingHours: '試營運至 2026 年 11 月 15 日，09:00–21:00，週一休館。12 月 18 日預定正式開館。',
    studyRoom: true,
    facilities: ['地下 1 樓自修室', '閱報區', '兒童閱覽區', '視障服務區', '資訊檢索區', '討論小間', '汽機車停車場'],
    areas: [{ name: '地下 1 樓自修室', kind: 'study', slots: null, access: null,
      equipment: {}, sources: [hsinchuFloorGuide] }],
    closures: [{ from: '2026-11-16', until: '2026-12-17', reason: '試營運結束，12 月 18 日預定正式開館',
      url: hsinchuOpening }],
  },
  {
    id: 'local-zhubei-stellar', name: '竹北星際圖書館', city: '新竹縣', district: '竹北市',
    address: '新竹縣竹北市中正西路52號', types: ['公共圖書館'],
    phone: '03-5518663',
    website: stellarOpening, sources: [stellarOpening, stellarSpace, 'https://www.openstreetmap.org/node/14355577123',
      'https://www.govserv.org/TW/Hsinchuhsien/151121962189874/竹北市立圖書館',
      'https://www.hsinchu.gov.tw/cp.aspx?n=1647'],
    coordinates: { latitude: 24.8396572, longitude: 121.0036135 },
    openingHours: '試營運：週二至週四 09:00–20:30，週五至週日 09:00–24:00。週一休館，特殊日期依公告。',
    facilities: ['嬰幼兒圖書區', '館內閱覽區', '書報區', '安靜自修區', '親子閱讀區'],
    accessNote: '試營運開放館內閱覽，暫停外借、預約、還書、通閱、檢索電腦及視聽設備服務。2026 年 11 月 13 日至 15 日限時 24 小時開放。試營運諮詢可洽竹北市公所總機 03-5515919。',
    studyRoom: true,
    areas: [{ name: '安靜自修區', kind: 'quiet', slots: null, access: null, equipment: {}, sources: [stellarSpace] }],
    closures: [],
  },
];

export function withAnnouncedLibraries(libraries: (Library & { city: string })[]) {
  return [...libraries, ...announcedLibraries.filter((announced) => !libraries.some((library) =>
    comparableAddress(library.address) === comparableAddress(announced.address)))];
}

const faxLocation = (value: string) => comparableAddress(value).replace(/-(?=\d)/g, '之');
const taichungFaxName = (value: string) => value.normalize('NFKC').replace(/\s/g, '')
  .replace(/^臺中市立圖書館/, '').replace(/(?:國立公共資訊圖書館精武分館|^精武圖書館$)/, '精武圖書館');

export function withTaichungDirectoryDetails(library: Library, directory: Library[]): Library {
  const hasHours = Boolean(library.openingHours || library.schedule?.length);
  if (library.fax && hasHours && library.facilities?.length) return library;
  const name = taichungFaxName(library.name);
  const address = faxLocation(library.address);
  const [match, duplicate] = directory.filter((candidate) =>
    taichungFaxName(candidate.name) === name && faxLocation(candidate.address) === address);
  if (!match || duplicate || !address) return library;
  const fax = library.fax ?? match.fax;
  const openingHours = hasHours ? library.openingHours : match.openingHours;
  const facilities = library.facilities?.length ? library.facilities : match.facilities ?? library.facilities;
  if (fax === library.fax && openingHours === library.openingHours && facilities === library.facilities) return library;
  return { ...library, fax, openingHours, facilities, sources: [...new Set([...library.sources, ...match.sources])] };
}

export function withLibraryDetail<T extends Library>(library: T, detail: LibraryDetail | undefined): T & Library {
  if (library.id === 'plis-4ae824a05d3504931b4e' && library.address === '屏東縣萬巒鄉萬和村中正路24號') {
    const address = '屏東縣萬巒鄉萬金村萬和路5之11號';
    library = { ...library, address, phone: '08-7836282', fax: undefined,
      coordinates: { latitude: 22.59639, longitude: 120.6145 },
      sources: [...library.sources, 'https://itaiwan.moe.gov.tw/doc/index.php?doc=416',
        'https://www.openstreetmap.org/way/1434626872'] };
    detail = { address, url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000447' };
  }
  if (library.id === 'plis-d34887b8b49b91a79656' && library.address === '南投縣信義鄉明德村玉山路47號') {
    const address = '南投縣信義鄉愛國村愛國巷114號';
    library = { ...library, address, phone: '049-2791534',
      coordinates: { latitude: 23.7060107, longitude: 120.8332703 },
      sources: [...library.sources, 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000252',
        'https://data.nantou.gov.tw/da_DK/dataset/d4d03a54-582b-4a5a-b7b8-f0ca56d2775b/resource/bf17428a-8756-4f85-875d-19a8bdf202b5/preview'] };
    detail = { address, url: nantouEarlyReading, hours: '臨時館開放時間請致電 049-2791534 確認。' };
  }
  if (library.id === 'plis-a2b6c71763cc26d5bc25' && library.address === '高雄市永安區永華路49號') {
    const address = '高雄市永安區保寧里保安路16巷5號';
    library = { ...library, address, coordinates: { latitude: 22.8351230, longitude: 120.2360251 },
      accessNote: '新館施工期間，請前往原永安國小保寧分校臨時館。',
      sources: [...library.sources, 'https://www.ksml.edu.tw/LibNews/Details.aspx?Parser=9,4,33,,,,15337',
        'https://data.gov.tw/dataset/177859'] };
    detail = { address, url: 'https://www.ksml.edu.tw/lib/content/index.aspx?Parser=1,56,576,570',
      hours: '臨時館週二至週日 09:00–17:00，週一及國定假日休館。',
      facilities: ['研習教室', '一般閱覽席'] };
  }
  if (library.id === 'plis-0a0cb9e669998c949020' && library.address === '新竹縣尖石鄉嘉樂村2鄰70號') {
    const address = '新竹縣尖石鄉嘉樂村2鄰64號';
    library = { ...library, address, coordinates: { latitude: 24.70548, longitude: 121.20295 },
      sources: [...library.sources, 'https://www.openstreetmap.org/way/1231623720'] };
    detail = { address, url: 'https://hcplibrary.hchcc.gov.tw/wSite/sp?orgId=003&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
      hours: '週二至週六 08:00–12:00、13:00–17:00。週日、週一、國定假日及選舉日休館。',
      facilities: ['開架閱覽室', '兒童閱覽室', '原住民館藏室'] };
  }
  if (library.id === 'plis-d31d9ccdab3c7bcf9ff3' && library.address === '新竹縣寶山鄉雙溪村館前路18號') {
    const address = '新竹縣寶山鄉雙園路二段283號';
    library = { ...library, address, coordinates: { latitude: 24.7665, longitude: 120.993 },
      accessNote: '原館整修期間，請前往雙園路二段 283 號老人文康中心臨時館。臨時館的自修空間待確認。',
      sources: [...library.sources, 'https://www.uknownews.com/page/article/show.aspx?num=6896',
        'https://ws.hsinchu.gov.tw/Download.ashx?n=5paw56u557ij6YG%2F6Zuj5pS25a655LiA6Ka96KGoLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvOC9yZWxmaWxlLzg2NjcvMjAxNDUzLzdiMWQwYjExLWZkNjQtNDk5Yi1iMTczLTBlYzBlOTI3MGRlMy5wZGY%3D'] };
    detail = { address, url: 'https://hcplibrary.hchcc.gov.tw/wSite/ct?ctNode=4293&mp=1&xItem=10814',
      hours: '臨時館週二至週日 08:00–17:00，特殊日期依館方公告。' };
  }
  if (library.id === 'plis-1d5bc6bb745d6ead49e9' && library.address === '苗栗縣竹南鎮大厝里真如路562號') {
    detail = { url: 'https://www.chunan.gov.tw/cp.aspx?n=11120', address: library.address,
      hours: '每日 08:00–18:00，春節及國定假日休館。',
      facilities: ['嬰幼兒親子共讀區', '兒童閱覽區', '樂齡閱覽區', '青少年閱覽區', '多功能空間', '自修室'] };
  }
  if (library.id === 'plis-5931f90c2b78f1094592' && library.address === '屏東縣新園鄉仙吉村新田路22巷21號') {
    detail = { url: xinyuanUrl, address: library.address, hours: xinyuanHours };
  }
  if (!detail?.address || comparableAddress(detail.address) !== comparableAddress(library.address)) return library;
  const candidate = localHours[library.id];
  const local = !detail.hours || candidate?.supersedesDirectory ? candidate : undefined;
  const hoursOverride = ['plis-9709456f17abc6c6a512', 'plis-5929930cfc61bd687f1f'].includes(library.id)
    ? hsinchuHoursOverride : undefined;
  const closure = buildingClosures[library.id];
  const study = libraryStudyHours(library.id);
  const reported = (nclStudyRooms as Record<string, { address: string; code: string; studyRoom: boolean } | undefined>)[library.id];
  const nclReport = reported && faxLocation(reported.address) === faxLocation(library.address) ? reported : undefined;
  const nclSource = nclReport ? 'https://libstat.ncl.edu.tw/libraryDataDetail/' + nclReport.code : undefined;
  const listed = Boolean(detail.facilities?.some((facility) => /^自[修習]室$/.test(facility)));
  const area: Area = {
    name: study?.name ?? '自修室', kind: 'study', slots: study?.slots ?? null, access: null, equipment: {},
    sources: [study?.url ?? (local?.studyRoom ? local.url : listed ? detail.url : nclSource ?? detail.url)],
  };
  const taipeiArea = taipeiStudyRoom(library, area, listed);
  const tainanArea = tainanStudyRoom(library.id, area);
  const kaohsiungArea = kaohsiungStudyRoom(library.id);
  const localArea = kaohsiungArea ?? tainanArea ?? localStudyRoom(library.id, taipeiArea ?? area);
  const studyAreas = library.id === 'plis-1ce0f598d0b6a3cce1c1' ? [
    { ...localArea, name: '4 樓自修室一般座位', seats: 64 },
    { ...localArea, name: '4 樓自修室筆電區', seats: 16,
      equipment: { ...localArea.equipment, laptop: true, outlet: true, wifi: true } },
  ] : [localArea];
  const studyRoom = Boolean(study || local?.studyRoom || listed || taipeiArea || tainanArea || kaohsiungArea || nclReport?.studyRoom);
  const calendar = libraryCalendar(library);
  const serviceUpdate = serviceUpdates[library.id];
  const readingOnly = hsinchuReadingOnly.has(library.id);
  const noStudyRoom = local?.studyRoom === false || readingOnly;
  const localFacilities = localFacilityLists[library.id];
  const baseFacilities = library.facilities ?? detail.facilities;
  const facilities = localFacilities
    ? [...new Set([...(baseFacilities ?? []), ...localFacilities.facilities])] : baseFacilities;
  const additionalArea = localAdditionalAreas[library.id];
  const additionalAreas = [additionalArea, library.id === 'plis-a094b0d4aa7d7722fd03' ? nationalTaiwanLaptopSeats : undefined].flat()
    .filter((area): area is Area => Boolean(area && !library.areas.some(({ name }) => name === area.name)));
  const areas = [...library.areas, ...additionalAreas];
  return {
    ...library,
    name: library.id === 'plis-e2c2e5a82e7e92aa1179' ? '新竹縣竹北市立圖書館福德分館' : library.name,
    openingHours: (closure && closure.from !== closure.until ? closure.reason : undefined)
      ?? library.openingHours ?? hoursOverride?.hours ?? local?.hours ?? detail.hours,
    calendarYears: calendar?.calendarYears ?? library.calendarYears,
    checkDates: calendar?.checkDates ? [...new Set([...(library.checkDates ?? []), ...calendar.checkDates])] : library.checkDates,
    closures: [...library.closures, ...(calendar?.closures ?? []), ...(closure ? [closure] : [])],
    accessNote: serviceUpdate?.note ?? library.accessNote,
    facilities: noStudyRoom ? facilities?.filter((facility) => !/^自[修習]室$/.test(facility)) : facilities,
    studyRoom: noStudyRoom ? false : library.studyRoom ?? (kaohsiungArea === null ? false : studyRoom || nclReport?.studyRoom),
    areas: noStudyRoom ? areas.filter(({ kind }) => kind !== 'study')
      : studyRoom && kaohsiungArea !== null && library.studyRoom !== false && !library.areas.some(({ kind }) => kind === 'study')
      ? [...library.areas, ...studyAreas, ...additionalAreas] : areas,
    sources: [...new Set([...library.sources, detail.url, ...(local ? [local.url] : []),
      ...(serviceUpdate ? [serviceUpdate.url] : []),
      ...(localFacilities ? [localFacilities.url] : []),
      ...(nclSource ? [nclSource] : []),
      ...(hoursOverride ? [hoursOverride.url] : []),
      ...(readingOnly ? [hsinchuReadingServices] : []),
      ...(kaohsiungArea === null ? [kaohsiungHoursSource] : []),
      ...(calendar?.closures.map(({ url }) => url) ?? []), ...(closure ? [closure.url] : [])])],
  };
}

const taoyuanSeatSystem: Record<string, { url?: string; seats?: number; name?: string; note?: string; onsiteOnly?: true } | undefined> = {
  'plis-9c317ee99e20f7ec3cd3': { url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/014', seats: 147 },
  'plis-0d8617adcdaa013618d9': { url: 'https://www.typl.gov.tw/kids/News/Content/2017', seats: 167 },
  'plis-0670e73215c152add507': { url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/038', seats: 50 },
  'plis-14dcd000784259e3f26c': { url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/021', name: '2 樓自修室', seats: 70 },
  'plis-a38508dd33caf0cfefdc': { url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/034', seats: 113, name: '1 樓自習室' },
  'plis-bb78c5df4d9aa277ab1c': { url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/041', seats: 45 },
  'plis-07c47313a8f5b473d2bf': { name: '3 樓第一自修室', seats: 84, onsiteOnly: true },
  'plis-67ab5e6b0d8d6c9a2e25': { seats: 101, onsiteOnly: true },
  'plis-62eb0222ac5626717a13': { seats: 304 },
  'plis-3fe72b1ccca37949b0a8': { seats: 244 },
  'plis-77084e202fe916823f9a': { seats: 115, note: '館方介紹列約 126 席，座位系統列 115 個當日登記席。' },
  'plis-34e3306f3ab833c97a42': { seats: 258 },
  'plis-6a9da03cdd3715adb30c': { seats: 265, note: '館方介紹列 265 席，座位系統列 258 個當日登記席。' },
  'plis-ab3dfbc049455a84068e': { seats: 110 },
  'plis-e13b542aa05bf70e234a': { seats: 60 },
  'plis-112e55434de56841e873': { seats: 98 },
  'plis-5f74f02b42c06b3fc9d9': { seats: 172, note: '另設 8 席筆電區。' },
};

const localStudyWifi: Record<string, string | undefined> = {
  'plis-47d9eb53677ef9688a15': 'https://www.nlpi.edu.tw/StaticPage/internet-access',
  'plis-62eb0222ac5626717a13': iTaiwanHotspots,
  'plis-eec71326733024bf68f9': iTaiwanHotspots,
  'plis-5929930cfc61bd687f1f': iTaiwanHotspots,
  'plis-112e55434de56841e873': 'https://culture.tycg.gov.tw/News_Content.aspx?n=11129&s=1470563',
  'plis-539f7d3d76b9f2ee658a': iTaiwanHotspots,
  'plis-e94c48945a092b5818d8': 'https://isp.ncl.edu.tw/files/file_pool/1/0N145527299641613348/（六）圖書館工作手冊(12.18修).pdf',
};

const taoyuanStudySeats: Record<string, { seats: number; url: string } | undefined> = {
  'plis-163c307c64aa5fc02e8a': { seats: 116, url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000136' },
  'plis-369d482f8c183f32943f': { seats: 44, url: 'https://libstat.ncl.edu.tw/libraryDataDetail/L5219001' },
  'plis-01e95280aebec7eba09c': { seats: 160, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/017' },
  'plis-99799da6e29815c7da11': { seats: 90, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/030' },
};

const taoyuanWalkInStudyRooms = new Set([
  'plis-8d09da2a8c7fc2f99893', 'plis-f9aa2d362caa1f76eec4', 'plis-094ed6f57775956545a2',
  'plis-68b3417f5a99cefe007d', 'plis-163c307c64aa5fc02e8a', 'plis-62af35b79d7d88c393d7',
  'plis-bb87f2dc7cdcad6eca8b', 'plis-369d482f8c183f32943f',
]);

const newTaipeiStudySeats: Record<string, { branchId: string; seats: number; name?: string } | undefined> = {
  'plis-8616f8eb019058a7080c': { branchId: '7ce26c583dfd45f896e4f02548c888f5', seats: 48, name: '2 樓自修閱覽區' },
  'plis-7f3cdf1da9a944e5be08': { branchId: '0770f83e977c4c0997b0b467783e314c', seats: 52 },
  'plis-2f3bedb51e2b23a23a59': { branchId: 'f421a1684d454905b28688325bf5815f', seats: 38, name: '自修區' },
  'plis-058be989d22b992c5b8a': { branchId: '099812be491c45e59238adcaf69d3443', seats: 16 },
  'plis-aadc3dc00e5a64262aae': { branchId: '74b66aa193f04492b1b9732e5a1b733b', seats: 78 },
  'plis-328bb20a01970d84f947': { branchId: '2ba325ce4a9a497faf1090779e598b2f', seats: 28, name: '7 樓個人 K 書座位' },
  'plis-150e321d181fa2d97261': { branchId: 'a3b061cbb80f4cbb92a2d75c60741d88', seats: 45, name: '3 樓自修室' },
};

function localStudyRoom(id: string, area: Area): Area {
  if (id === 'plis-f0fd06a0e196d2f09357') {
    return { ...area, entryNote: '週一只開放自修室及藝文走廊，國定假日休館。',
      sources: [...area.sources, 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000262'] };
  }
  if (id === 'plis-949d8708d5597baaf12e') {
    return { ...area, entryNote: '開放一般民眾閱覽及自習，請勿預占座位，離座達 30 分鐘視同放棄座位。',
      sources: [...area.sources, 'https://www.taimali.gov.tw/home/index.php/2020-04-16-07-15-03/category/31-2020-06-15-03-43-34.html?download=18%3A2020-06-15-03-50-18'] };
  }
  if (id === 'plis-8258ecedb33967785152') {
    const url = 'https://www.tch.gov.tw/News_Content.aspx?n=10075&s=1005364';
    return { ...area, closures: [...(area.closures ?? []), {
      from: '2026-10-16', reason: '信東路 90 號自修室因耐震評估未通過，自 2026 年 10 月 16 日起閉館。館方規劃於新館提供自修服務。', url,
    }], sources: [...area.sources, url] };
  }
  if (id === 'plis-9bee8536cf45c910547b') {
    return { ...area, entryNote: '研習教室供自修及研習課程使用。' };
  }
  if (id === 'plis-5c096392579b74bd371a') {
    return { ...area, name: '2 樓右側閱覽室', entryNote: '閱覽室供讀者進修，也作為藝文活動場地。',
      sources: [...area.sources, 'https://jiaosi.e-land.gov.tw/cp.aspx?n=7775&s=2682'] };
  }
  if (id === 'plis-114080cf8fa32977d08a') {
    return { ...area, name: '地下 1 樓自修室',
      sources: [...area.sources, 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=4643DE8A8785BFD0&sms=CFFFC938B352678A'] };
  }
  if (id === 'plis-c1eecc7328938e1f8113') {
    const url = 'https://reading.tpml.gov.taipei/News_Content.aspx?n=B3B7F57C7B16FDE6&s=A1ED499E7D303433&sms=78D644F2755ACCAA';
    return { ...area, sources: [...area.sources, url],
      closures: [...(area.closures ?? []), { from: '2026-11-27', until: '2026-11-27',
        reason: '選務作業期間自修室暫停開放，服務臺及 3 樓閱覽區正常開放。', url }],
    };
  }
  if (id === 'plis-4d33d19b31ac419fb05c') {
    return { ...area, name: '8 樓自修室',
      limitedOpening: {
        from: '2026-11-02', until: '2026-11-14', name: '8 樓自修室（部分開放）',
        entryNote: '11 月 2 日至 7 日木桌區施工，11 月 8 日至 14 日鋁桌區施工。請依現場指示使用開放區域。',
      },
      sources: [...area.sources, 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=931dcf222e9d45cd9b0a06c62b55d18c'],
    };
  }
  if (id === 'plis-9d70717f141dbff4f2b6') return { ...area, seats: 38 };
  const newTaipei = newTaipeiStudySeats[id];
  if (newTaipei) {
    const url = 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=' + newTaipei.branchId;
    return { ...area, name: newTaipei.name ?? area.name, seats: newTaipei.seats, sources: [...area.sources, url] };
  }
  if (id === 'plis-1ed4208570aa338878bc') {
    return { ...area, name: '4 樓自修閱覽室', seats: 40, equipment: { ...area.equipment, wifi: true },
      entryNote: '館內提供充電設備，座位是否設有插座待確認。本站僅提供自修與館內閱報。',
      sources: [...area.sources, 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000602'] };
  }
  if (id === 'plis-eaf4c3b42e1346a4f7e0') {
    return { ...area, name: '地下 1 樓自修室', seats: 84 };
  }
  if (id === 'plis-e236f05575016f72b791') {
    return { ...area, seats: 42 };
  }
  if (id === 'plis-f6701d622c9bbfa1dd39') {
    return { ...area, seats: 24 };
  }
  if (id === 'plis-b5812bfda43fbd06e2a4') {
    return { ...area, name: '6 樓閱覽室', seats: 108,
      sources: [...area.sources, 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=e57e1d4b92334b029508f25dc38c4a39'] };
  }
  if (id === 'plis-e1f47e046250c8795b4f') {
    return { ...area, seats: 320 };
  }
  if (id === 'plis-a094b0d4aa7d7722fd03') {
    return { ...area, name: '3 樓自修室', seats: 178, access: 'card', regionalCard: 'nationalTaiwan',
      equipment: { ...area.equipment, wifi: true, laptop: true },
      entryNote: '自修席分為現場刷卡登記 92 席及線上預約 86 席，請持本人國立臺灣圖書館借閱證或悠遊卡借閱證辦理。筆電限室內 12 席指定座位。',
      reservation: 'https://ireserve.ntl.edu.tw/sm/home_web.do',
      sources: [...area.sources, 'https://www.ntl.edu.tw/wSite/ct?ctNode=1746&mp=1&xItem=87059',
        'https://www.ntl.edu.tw/wSite/ct?ctNode=3193&mp=1&xItem=49384', nationalTaiwanWifi] };
  }
  if (id === 'plis-aa077d31f651076b59ef') {
    return { ...area, closures: [...(area.closures ?? []), {
      from: '2026-11-09', until: '2026-11-09', reason: '5 樓自修室清潔暫停開放', url: yuminCleaning,
    }], sources: [...area.sources, yuminCleaning] };
  }
  if (id === 'plis-05da96e29ca78b9de81a') {
    return { ...area, name: '2 樓 K 書中心' };
  }
  if (id === 'plis-a382f4004c63510e6b53') {
    return { ...area, name: '2 樓自修室',
      slots: [0, 2, 3, 4, 5, 6].map((day) => ({
        day, start: minutes('08:00'), end: minutes(day === 0 ? '16:00' : day === 6 ? '17:00' : '20:00'),
      })),
      slotPeriod: { from: '2026-11-03', until: '2027-02-28' } };
  }
  if (id === 'plis-452d6d9aa6f6aa4a66f2') {
    return { ...area, seats: 24 };
  }
  if (id === 'plis-687f7b5047ffb263f313') {
    return { ...area, entryNote: '縣府資料列出 4 至 9 月週二至週四 17:00–19:00 的自修時段，該時段暫停借還書。' };
  }
  if (id === 'plis-859b54d11aaf9ac7b9be') {
    return { ...area, name: '1 樓自修室', seats: 46,
      sources: [...area.sources, 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000157',
        'https://www.cna.com.tw/postwrite/chi/347529'] };
  }
  if (id === 'plis-4b6847d140ab7464db3f') {
    return { ...area, entryNote: '自習區專用開放時段請向館方確認。' };
  }
  if (taoyuanWalkInStudyRooms.has(id)) {
    area = { ...area, access: 'walk-in', entryNote: '依現場指示入座。館方視情況於開館前發放號碼牌。',
      equipment: id === 'plis-62af35b79d7d88c393d7' ? area.equipment : { ...area.equipment, laptop: true },
      sources: [...area.sources, 'https://www.typl.gov.tw/zh-tw/Reader/RegulationContent/20', taoyuanSeatPortal] };
  }
  if (id === 'plis-3fb94b86e4de966ba65a') {
    return { ...area, access: 'walk-in', equipment: { ...area.equipment, outlet: true },
      entryNote: '一人限用一席，暫時離席須在 60 分鐘內返回。自修室插座可供充電。',
      sources: [...area.sources, 'https://lib.ylccb.gov.tw/wSite/ct?ctNode=5240&mp=1&xItem=11513'] };
  }
  if (id === 'plis-094ed6f57775956545a2') return { ...area, seats: 85, equipment: { ...area.equipment, wifi: true } };
  if (id === 'plis-016c903b9ad9d1b886d6') {
    return { ...area, name: '地下 1 樓自修室', access: 'walk-in', equipment: { outlet: false, laptop: false },
      entryNote: '通常自由入座，例假日或特殊期間可能發號碼牌。自修室禁止私自接用電器。使用筆電請至 1 樓期刊室無線上網區並自備電源。',
      sources: [...area.sources, yuanlinLibraryRules,
        'https://files.chcg.gov.tw/files/彰化縣員林市立圖書館自修室使用須知1040808_58_1090416.pdf'] };
  }
  if (id === 'plis-e7aaecf3515c7452935c') {
    return { ...area, access: 'walk-in', sources: [...area.sources, chiayiCountyReadingRules] };
  }
  const hsinchuCountyRules = 'https://hcplibrary.hchcc.gov.tw/wSite/ct?CPType=&ctNode=4303&mp=1&xItem=10646';
  if (['plis-946f82daf9ca97d241ba', 'plis-2bbbdcd83068ffcf8f4f', 'plis-24ed27c19953ccb5f0c4',
    'plis-0d08a9f889b9abeca093', 'plis-bda0333882d76e416b20', 'plis-6937f16a63ea043f0527',
    'plis-cf8f59d429a9ca2188f7', 'plis-12cb176cd411e9d41770'].includes(id)) {
    area = { ...area, access: 'walk-in', sources: [...area.sources, hsinchuCountyRules] };
  }
  if (id === 'plis-cf8f59d429a9ca2188f7') {
    return { ...area, name: '地下室自修室', seats: 25,
      sources: [...area.sources, qionglinLibrary] };
  }
  if (id === 'plis-9f7edd85cf79ea635049') {
    return { ...area, equipment: { laptop: true, outlet: true }, entryNote: '自修區指定區域可用電，其餘座位請自備電力。' };
  }
  if (id === 'plis-c45011eb98a75a2b9c10') {
    return { ...area, seats: 100, access: 'walk-in',
      sources: [...area.sources, 'https://www.lotong.gov.tw/UploadDir/OpenInfromation/閱覽要點112修正.pdf'] };
  }
  const wifi = localStudyWifi[id];
  if (wifi) area = { ...area, equipment: { ...area.equipment, wifi: true }, sources: [...area.sources, wifi] };
  const taoyuanSeats = taoyuanStudySeats[id];
  if (taoyuanSeats) return { ...area, seats: taoyuanSeats.seats, sources: [...area.sources, taoyuanSeats.url] };
  if (id === 'plis-2bbbdcd83068ffcf8f4f') {
    return { ...area, name: '2 樓多功能自修室', seats: 54,
      entryNote: '改造後於 2026 年 11 月 1 日開始試營運。',
      sources: [...area.sources, 'https://www.govserv.org/TW/Unknown/103898815758341/新埔鎮公所',
        'https://udn.com/news/story/7324/9851791'] };
  }
  if (id === 'plis-946f82daf9ca97d241ba') {
    return { ...area, entryNote: '國立公共資訊圖書館名錄列出 5 至 6 月自修室週二至週日 08:00–21:00，週一及國定假日休館。' };
  }
  if (id === 'plis-e94c48945a092b5818d8') {
    return { ...area, seats: 141, access: 'walk-in',
      entryNote: '自由入座，請勿預佔座位。一般閱覽座位 138 席，另有身心障礙人士專用席 3 席。',
      sources: [...area.sources, 'https://hcplibrary.hchcc.gov.tw/wSite/public/Attachment/f1766106527415.pdf',
        'https://hcplibrary.hchcc.gov.tw/wSite/ct?ctNode=4302&mp=1&xItem=8085'] };
  }
  if (id === 'plis-703e62be51f0cd3f7e93') {
    return { ...area, entryNote: '自 2026 年 6 月 1 日起，國定假日 08:00–20:00 開放。',
      sources: [...area.sources, 'https://mlc.edu.tw/System/mainedu/News/Detail.php?ID=53723'] };
  }
  if (id === 'plis-838b908932f56e7b1d22') {
    return { ...area, name: '1 樓自修區',
      entryNote: '啟用時公告可容納 20 人，目前席數與自修區專用時段待館方確認。',
      sources: [...area.sources, 'https://isp.ncl.edu.tw/files/file_pool/1/0N087443665349792009/110連江縣.pdf',
        'https://www.matsu-news.gov.tw/news/article/13603'] };
  }
  if (id === 'plis-387900bcde6ccbe06570') {
    return { ...area, name: '3 樓閱讀自習室',
      entryNote: '整修後自習室位於 3 樓，所列時段來自整修前的名錄，請向館方確認。',
      sources: [...area.sources, jinshaReopening] };
  }
  if (id === 'plis-ca5bd98a9d6dcfd1159b') {
    return { ...area, name: '1 樓自修室', sources: [...area.sources, kinmenCollectionPolicy] };
  }
  if (id === 'plis-f3080ccd8c34dad70222') {
    return { ...area, name: '2 樓閱覽室（自修室）', access: 'walk-in',
      closures: penghuStudyClosures, equipment: { laptop: true, wifi: true },
      entryNote: '筆電等電子設備請保持靜音。請勿預佔座位，考季期間可能不定時清場。',
      sources: [...area.sources, penghuMainUrl] };
  }
  if (id === 'plis-8e698a4770cf01e3875e') {
    return { ...area, seats: 147, access: 'conditional',
      entryNote: '持借閱證或身分證使用座位管理系統，自由選位後對號入座，請勿預占其他座位。離座逾 1 小時未歸，館方得取消座位使用權。館方請 12 歲以下讀者使用兒童閱覽室。',
      sources: [...area.sources, 'https://glrs.nantou.gov.tw/LawContent.aspx?id=GL000630'] };
  }
  if (id === 'plis-d4bafe538b622515b304') {
    return { ...area, name: '3 樓自習室', seats: 100,
      sources: [...area.sources, 'https://www.changhua.gov.tw/RowContent/2242'] };
  }
  if (id === 'plis-424ebe1541690abe5b92') {
    return { ...area, name: 'B1 讀者自習室', seats: 42,
      sources: [...area.sources, 'https://www.chcg.gov.tw/TSO/Puxin/07other/main.aspx?main_id=12367'] };
  }
  if (id === 'plis-61f904e8f436ea8fc25d') {
    return { ...area, access: 'walk-in', equipment: { laptop: false },
      entryNote: '自由入座，每人一席。自修室限閱讀，筆電及平板請至資訊閱讀區。每月最後一個星期一清潔休館。',
      sources: [...area.sources, 'https://ctrl.chcg.gov.tw/main/main_act3/mainV2.aspx?act_id=45&main_id=33233'] };
  }
  const changhuaMain = id === 'plis-b19f4a632868ac1ed335';
  if (changhuaMain || id === 'plis-f935063eced556c94ad8') {
    return { ...area, seats: changhuaMain ? 70 : 38, access: 'card', regionalCard: 'changhua',
      entryNote: '持彰化縣公共圖書館個人借閱證線上預約或現場登記，須於時段開始後 30 分鐘內刷證報到。',
      reservation: 'https://ireserve.toread.bocach.gov.tw/sm/home_web.do',
      sources: [...area.sources, changhuaMain ? 'https://lib.bocach.gov.tw/cp.aspx?n=933'
        : 'https://www.chcg.gov.tw/TSO/tianzhong/04bulletin/bulletin02_con.aspx?bull_id=392826'] };
  }
  if (id === 'plis-d7b92d13f890b0fd9998') {
    return { ...area, name: '3 樓自修區', sources: [...area.sources, 'https://zuhu.yunlin.gov.tw/sihhuLIB.htm'] };
  }
  if (id === 'plis-674920ab9a5621eaf6cf') {
    return { ...area, name: '自修區', seats: 98, access: 'card', regionalCard: 'taitung',
      entryNote: '持臺東縣公共圖書館借閱證至入口機台現場登記，一人一卡，當日使用。',
      sources: [...area.sources, 'https://culture.taitung.gov.tw/activity/臺東縣立圖書館各式活動'] };
  }
  if (id === 'plis-41bce5bf027121bcb9e9') {
    return { ...area, equipment: { ...area.equipment, laptop: true },
      entryNote: '可使用筆電及平板，請勿影響他人閱讀。充電座位位置請向館方確認。',
      sources: [...area.sources, 'https://www.ttjfng.gov.tw/home/images/download/rules-stra/1150126.pdf'] };
  }
  if (id === 'plis-00bd1306ca6884693919') {
    return { ...area, seats: 124,
      sources: [...area.sources, 'https://files.chcg.gov.tw/files/0424-%E7%BE%A4%E5%BE%A1-%E5%92%8C%E7%BE%8E%E9%8E%AE%E8%A8%8A%20NO77%28s%29_57_1070507.pdf'] };
  }
  if (id === 'plis-539f7d3d76b9f2ee658a') {
    const reservation = 'https://libseat.hccg.gov.tw/sm/home_web.do';
    return { ...area, seats: 46, access: 'card', regionalCard: 'hsinchuCity', reservation,
      entryNote: '使用新竹市圖書館空間座位管理系統預約或現場登記。',
      sources: [...area.sources, reservation,
        'https://library.hccg.gov.tw/chhcml/app/data/view?id=18&module=userTerm&serno=60c961f1-8587-4460-9f9d-cb9862d4e41c',
        'https://www.hsinchu-cc.gov.tw/upload/79/2024102513561144607%E6%96%B0%E7%AB%B9%E5%B8%82%E8%AD%B0%E6%9C%83%E7%AC%AC11%E5%B1%86%E7%AC%AC3%E6%AC%A1%E5%AE%9A%E6%9C%9F%E6%9C%83%E8%AD%B0%E4%BA%8B%E9%8C%84%28%E4%B8%8A%E5%86%8A%29.pdf'] };
  }
  if (id === 'plis-5929930cfc61bd687f1f') {
    return { ...area, seats: 216, equipment: { ...area.equipment, outlet: true },
      sources: [...area.sources, 'https://library.hccg.gov.tw/chhcml/app/digital/view?id=55&module=branchLibrary&serno=15f84f6d-dc3c-4b82-8e80-df80b371c164'] };
  }
  if (id === 'plis-6c9e30dc1c6abf7a17d4') {
    return {
      ...area, access: 'card', regionalCard: 'keelung', seats: 109,
      entryNote: '持基隆市圖個人借閱證，線上預約或到館登記。每次原則為 1–3 小時，現場零星時段至少 30 分鐘。',
      reservation: 'https://ireserve.klccab.gov.tw/',
      sources: [...area.sources, 'https://kllib.klcg.gov.tw/cp.aspx?n=9043',
        'https://kllib.klcg.gov.tw/News_Content.aspx?_CSN=150&n=7789&s=18148&sms=12521'],
    };
  }
  if (id === 'plis-b4d4a98c101cbfdc3b6d' || id === 'plis-9df366887a25b0673ee7') {
    return { ...area, seats: id === 'plis-b4d4a98c101cbfdc3b6d' ? 38 : 24 };
  }
  const taoyuan = taoyuanSeatSystem[id];
  if (taoyuan) {
    const main = id === 'plis-0d8617adcdaa013618d9';
    return {
      ...area, name: taoyuan.name ?? area.name, access: 'card', regionalCard: 'taoyuan', seats: taoyuan.seats,
      equipment: main ? { ...area.equipment, laptop: false } : area.equipment,
      entryNote: '持桃園市圖個人借閱證或市民卡登記。'
        + (taoyuan.onsiteOnly ? '座位系統目前列為當日席，請至館內登記。' : '預約席與當日席依座位系統顯示。')
        + (main ? '7 樓自修室為極靜區，使用筆電請移至同樓層筆電區。' : taoyuan.note ?? ''),
      reservation: taoyuan.onsiteOnly ? undefined : taoyuanSeatPortal,
      sources: [...new Set([...area.sources, ...(taoyuan.url ? [taoyuan.url] : []),
        taoyuanSeatRules, taoyuanSeatPortal])],
    };
  }
  return area;
}
