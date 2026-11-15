import { minutes, type Slot } from './study.ts';

type WeeklyRange = [days: string, start: string, end: string];
type StudyHours = { name: string; ranges: WeeklyRange[]; url?: string };

const standardTaoyuan: WeeklyRange[] = [['23456', '08:30', '21:00'], ['01', '08:30', '17:00']];
const shortTaoyuan: WeeklyRange[] = [['0123456', '08:30', '17:00']];
const hsinchuRules = 'https://library.hccg.gov.tw/chhcml/app/data/view?id=18&module=userTerm&serno=b39fff74-7075-46ee-85c5-dee460b6f208';
const hsinchuLate: WeeklyRange[] = [['2345', '09:00', '21:00'], ['06', '09:00', '17:00']];

// 館舍詳情明列的專室時段。各範圍以 0 至 6 代表週日至週六。
const studyHours: Record<string, StudyHours | undefined> = {
  'plis-5587a95889a363b4a4d6': {
    name: '4 樓自修室', ranges: [],
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000245',
  },
  'plis-01c9a1adc4574a281c5b': {
    name: '2 樓自修室', ranges: [],
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000443',
  },
  'plis-ac3add9fd375b8182dcc': {
    name: '2 樓自修室', ranges: [],
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000458',
  },
  'plis-a84767f448c8fd5408a7': {
    name: '3 樓自習及閱報區', ranges: [],
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000285',
  },
  'plis-271e4d234a01bec2a0b0': {
    name: '2 樓自修閱覽區', ranges: [],
    url: 'https://www.cycab.gov.tw/wSite/sp?idPath=5217_5222_5236&mp=1&orgId=004&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  },
  'plis-6937f16a63ea043f0527': {
    name: '3 樓自修教室', ranges: [],
    url: 'https://hcplibrary.hchcc.gov.tw/wSite/sp?idPath=4292_4295&mp=1&orgId=005&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  },
  'plis-f0fd06a0e196d2f09357': {
    name: '1 樓自修室', ranges: [['0123456', '09:00', '21:00']],
    url: 'https://lib.bocach.gov.tw/cp.aspx?n=1212',
  },
  'plis-949d8708d5597baaf12e': {
    name: '1 樓閱覽室', ranges: [],
    url: 'https://www.taimali.gov.tw/home/index.php/about/2020-04-16-07-53-00.html',
  },
  'plis-96bdb053d7e967f965dc': {
    name: '3 樓 K 書中心', ranges: [], url: 'https://www.fonglin.gov.tw/cp.aspx?n=1934',
  },
  'plis-7f6f1af1d74f76b8b82a': {
    name: '4 樓自修研習室', ranges: [],
    url: 'https://www.tnpl.tn.edu.tw/Page/EachPavilionIndex.aspx?id=u5764397187548319569',
  },
  'plis-06504d756c4ec047d449': {
    name: '3 樓讀者自修室', ranges: [['023456', '09:00', '18:00']], url: 'https://lib.bocach.gov.tw/cp.aspx?n=1218',
  },
  'plis-55d667571365c82059b9': { name: '自修室', ranges: [['023456', '08:00', '17:00']] },
  'plis-47d9eb53677ef9688a15': {
    name: '地下 1 樓自修室', ranges: [['23456', '09:00', '21:00'], ['0', '09:00', '17:00']],
    url: 'https://www.nlpi.edu.tw/StandardTemplates/Handlers/FileHandler.ashx?fid=26137ded-fc05-4626-8656-4d9a70770736&no=1&sourceType=0&type=FileUpload',
  },
  'plis-1fc4f3afa8489d59630b': {
    name: '4 樓自習室', ranges: [], url: 'https://lib.bocach.gov.tw/cp.aspx?n=1217',
  },
  'plis-6c7f064db2438bb7406f': {
    name: '自修與閱讀區', ranges: [], url: 'https://lib.bocach.gov.tw/cp.aspx?n=1213',
  },
  'plis-2d3f2c4c3a1113d9887a': {
    name: '3 樓自習室', ranges: [], url: 'https://lib.bocach.gov.tw/cp.aspx?n=1208',
  },
  'plis-9d70717f141dbff4f2b6': {
    name: '3 樓自修室', ranges: [],
    url: 'https://www.cultural.pthg.gov.tw/library/cp.aspx?n=CDFE6D1C65C796B9&s=38F41086022F1178',
  },
  'plis-4d0c8d7a33e035e307ff': {
    name: '自修室', ranges: [], url: 'https://libstat.ncl.edu.tw/libraryDataDetail/L3485000',
  },
  'plis-afedb45a9eff2865c224': {
    name: '地下室自修室', ranges: [],
    url: 'https://www.cultural.pthg.gov.tw/library/cp.aspx?n=CDFE6D1C65C796B9&s=07BDBA9682DF7079',
  },
  'plis-ed53f27461a95b24573d': {
    name: '1 樓自修區', ranges: [], url: 'https://libstat.ncl.edu.tw/libraryDataDetail/L3351000',
  },
  'plis-452d6d9aa6f6aa4a66f2': {
    name: '自修閱覽區', ranges: [],
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000464',
  },
  'plis-7417038e0db9b35c62ea': {
    name: '3 樓自修室', ranges: [['023456', '08:00', '17:00']],
    url: 'https://www.houlong.gov.tw/cp.aspx?n=4134',
  },
  'plis-687f7b5047ffb263f313': {
    name: '3 樓自修室', ranges: [], url: 'https://opendata.miaoli.gov.tw/OpenDataDetail.aspx?n=9404&s=1811',
  },
  'plis-eaf18916c54c8e1fffc3': {
    name: '自修室', ranges: [], url: 'https://libstat.ncl.edu.tw/libraryDataDetail/L5229000',
  },
  'plis-2065ea3c3619a2597356': {
    name: 'K 書中心', ranges: [], url: 'https://kllib.klcg.gov.tw/cp.aspx?n=7932',
  },
  'plis-d5b8a42994a660f05102': {
    name: 'K 書中心', ranges: [], url: 'https://kllib.klcg.gov.tw/cp.aspx?n=7928',
  },
  'plis-65dcee6860c52419f419': {
    name: '自修區', ranges: [], url: 'https://kllib.klcg.gov.tw/cp.aspx?n=7938',
  },
  'plis-e2c2e5a82e7e92aa1179': {
    name: 'K 書室', ranges: [],
    url: 'https://hcplibrary.hchcc.gov.tw/wSite/sp?idPath=4292_4295&mp=1&orgId=016&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  },
  'plis-9f7edd85cf79ea635049': {
    name: '2 樓自修區', ranges: [], url: 'https://yilan.e-land.gov.tw/News.aspx?n=18708&sms=16140',
  },
  'plis-5c096392579b74bd371a': {
    name: '2 樓閱覽室', ranges: [['023456', '09:00', '18:00']], url: 'https://jiaosi.e-land.gov.tw/cp.aspx?n=7777',
  },
  'plis-4b6847d140ab7464db3f': {
    name: '2 樓自習區', ranges: [], url: 'https://ilwct.e-land.gov.tw/cp.aspx?n=6620',
  },
  'plis-9bee8536cf45c910547b': {
    name: '2 樓研習教室', ranges: [], url: 'https://www.sanshing.gov.tw/cp.aspx?n=5799&s=2587',
  },
  'plis-c9c0fe185180d1def859': {
    name: '2 樓自修室', ranges: [], url: 'https://www.guanshan.gov.tw/about/about4',
  },
  'plis-f9aa2d362caa1f76eec4': {
    name: '3 樓自修室', ranges: [], url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/033',
  },
  'plis-68b3417f5a99cefe007d': {
    name: '1 樓自修室', ranges: [], url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/049',
  },
  'plis-942c78ab15d304c768e8': {
    name: '2 樓自修室', ranges: [],
    url: 'https://lib.ylccb.gov.tw/wSite/sp?ctNode=6218&mp=1&orgId=003&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  },
  'plis-0e472236b6cd90d7217c': {
    name: '自修區', ranges: [],
    url: 'https://lib.ylccb.gov.tw/wSite/sp?ctNode=6218&mp=1&orgId=021&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  },
  'plis-c326876c7e0206c1aba1': {
    name: '10 樓自修區', ranges: [],
    url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=72657041F7AA3992&sms=CFFFC938B352678A',
  },
  'plis-a3aa908413cf852b7708': {
    name: '自修區', ranges: [],
    url: 'https://www.tnpl.tn.edu.tw/Page/EachPavilionIndex.aspx?id=u5652998376458763182',
  },
  'plis-094ed6f57775956545a2': {
    name: '3 樓自修室', ranges: [], url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/046',
  },
  'plis-7d5f6b4a8aae37204a84': {
    name: '自修室', ranges: [], url: 'https://libstat.ncl.edu.tw/libraryDataDetail/L3457000',
  },
  'plis-d4bafe538b622515b304': {
    name: '3 樓自習室', ranges: [['13456', '08:30', '20:30'], ['0', '08:30', '17:00']],
    url: 'https://www.changhua.gov.tw/Content/192',
  },
  'plis-34ea4e3647b8191ffef9': {
    name: '普通閱覽室', ranges: [['23456', '09:00', '20:00'], ['0', '09:00', '17:00']],
    url: 'https://library.chiayi.gov.tw/wSite/sp?xdUrl=/wSite/ApBlock/Library.jsp&orgId=003&mp=1&idPath=5217_5222_5236',
  },
  'plis-24c304d8d8fc5bc58ab9': {
    name: '2 樓自修區', ranges: [],
    url: 'https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000476',
  },
  'plis-c45011eb98a75a2b9c10': {
    name: '南豪館 2 樓自修室', ranges: [['023456', '08:30', '17:00']],
    url: 'https://www.lotong.gov.tw/cp.aspx?n=17720',
  },
  'plis-3d795f800ef6fa08fae9': {
    name: '6 樓自修室', ranges: [['2345', '08:00', '20:30'], ['6', '07:00', '20:30'], ['0', '07:00', '17:00']],
    url: 'https://www.tnpl.tn.edu.tw/u4642064804104429342/a1',
  },
  'plis-d6493c0ee9ea1f948cec': {
    name: '自修室', ranges: [['023456', '08:00', '17:30']],
    url: 'https://liouying.tainan.gov.tw/News_Content.aspx?n=20270&s=7717656',
  },
  'plis-12cb176cd411e9d41770': {
    name: '自修室', ranges: [['023456', '08:00', '17:00']],
    url: 'https://hcplibrary.hchcc.gov.tw/wSite/sp?idPath=4292_4295&mp=1&orgId=012&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  },
  'plis-24ed27c19953ccb5f0c4': {
    name: 'C 棟 2 樓自修室', ranges: [['023456', '08:30', '17:00']],
  },
  'plis-703e62be51f0cd3f7e93': {
    name: '3 樓閱覽室', ranges: [['023456', '08:00', '21:00']],
    url: 'https://opendata.miaoli.gov.tw/OpenDataDetail.aspx?n=9404&s=1811',
  },
  'plis-8258ecedb33967785152': {
    name: '自修室', ranges: [['2345', '09:00', '21:00'], ['06', '09:00', '17:00']],
    url: 'https://www.toufen.gov.tw/cp.aspx?n=3043',
  },
  'plis-f3080ccd8c34dad70222': {
    name: '閱覽室（讀者自修室）', ranges: [['12', '08:30', '17:30'], ['03456', '08:30', '21:00']],
    url: 'https://www.phlib.nat.gov.tw/wSite/ct?ctNode=5248&mp=1&xItem=9882',
  },
  'plis-e3c1d8e816d9e6061a7d': {
    name: '南棟 3 樓自修室', ranges: [['023456', '08:00', '21:30']],
    url: 'https://cabkc.kinmen.gov.tw/information?pid=5106&uid=9',
  },
  'plis-8e698a4770cf01e3875e': {
    name: '4 樓自由閱讀區', ranges: [['23456', '08:30', '20:30'], ['0', '08:30', '17:00']],
    url: 'https://www.nthcc.gov.tw/A7_2/content/130',
  },
  'plis-a094b0d4aa7d7722fd03': { name: '自修室', ranges: [['023456', '08:00', '21:00']] },
  'plis-0d8617adcdaa013618d9': {
    name: '7 樓自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/Reader/RegulationContent/20',
  },
  'plis-112e55434de56841e873': {
    name: '5 樓自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/051',
  },
  'plis-8d09da2a8c7fc2f99893': { name: '自修室', ranges: standardTaoyuan },
  'plis-01e95280aebec7eba09c': { name: '自修室', ranges: standardTaoyuan },
  'plis-9c317ee99e20f7ec3cd3': { name: '6 樓自修室', ranges: standardTaoyuan },
  'plis-0670e73215c152add507': {
    name: 'B1 自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/038',
  },
  'plis-62eb0222ac5626717a13': {
    name: 'B1 自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/044',
  },
  'plis-77084e202fe916823f9a': {
    name: '3 樓自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/032',
  },
  'plis-34e3306f3ab833c97a42': {
    name: '3 樓自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/043',
  },
  'plis-6a9da03cdd3715adb30c': {
    name: '4 樓自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/042',
  },
  'plis-3fe72b1ccca37949b0a8': {
    name: '2 樓自修閱覽室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/039',
  },
  'plis-163c307c64aa5fc02e8a': {
    name: '2 樓自修區', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/048',
  },
  'plis-ab3dfbc049455a84068e': {
    name: '自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/047',
  },
  'plis-e13b542aa05bf70e234a': {
    name: '自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/011',
  },
  'plis-62af35b79d7d88c393d7': {
    name: '3 樓自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/027',
  },
  'plis-67ab5e6b0d8d6c9a2e25': {
    name: '6 樓極靜自修區', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/025',
  },
  'plis-dd0e38aa18f750ffcade': { name: 'B1 自修室', ranges: [['123456', '08:30', '21:00'], ['0', '08:30', '17:00']] },
  'plis-07c47313a8f5b473d2bf': {
    name: '3 樓自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/028',
  },
  'plis-79f43b2ba26bb9afade0': { name: '自修室', ranges: standardTaoyuan },
  'plis-99799da6e29815c7da11': { name: '2 樓自修室', ranges: standardTaoyuan },
  'plis-5f74f02b42c06b3fc9d9': {
    name: '自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/016',
  },
  'plis-b4d4a98c101cbfdc3b6d': {
    name: '3 樓自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/015',
  },
  'plis-bb87f2dc7cdcad6eca8b': {
    name: '自修閱覽室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/036',
  },
  'plis-369d482f8c183f32943f': {
    name: '2 樓自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/037',
  },
  'plis-14dcd000784259e3f26c': {
    name: '2 樓自修室', ranges: standardTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/021',
  },
  'plis-1ed4208570aa338878bc': {
    name: '自修室', ranges: shortTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/045',
  },
  'plis-76fd541d0ef4efcbb6ab': {
    name: '自修室', ranges: shortTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/040',
  },
  'plis-9df366887a25b0673ee7': {
    name: '多功能研習教室（自修室）', ranges: shortTaoyuan, url: 'https://www.typl.gov.tw/zh-tw/About/Introduce/04',
  },
  'plis-a38508dd33caf0cfefdc': { name: '自習室', ranges: standardTaoyuan },
  'plis-bb78c5df4d9aa277ab1c': { name: '1 樓自修室', ranges: standardTaoyuan },
  'plis-e94c48945a092b5818d8': { name: '自修室', ranges: [['023456', '08:30', '20:30']] },
  'plis-0d08a9f889b9abeca093': { name: '4 樓自修室', ranges: [['23456', '08:00', '20:00'], ['0', '08:00', '17:00']] },
  'plis-9709456f17abc6c6a512': { name: '自修室', ranges: hsinchuLate, url: hsinchuRules },
  'plis-539f7d3d76b9f2ee658a': { name: '3 樓自修室', ranges: hsinchuLate, url: hsinchuRules },
  'plis-5929930cfc61bd687f1f': { name: '西門自修室', ranges: hsinchuLate, url: hsinchuRules },
  'plis-859b54d11aaf9ac7b9be': { name: '自修室', ranges: [['023456', '09:00', '17:00']], url: hsinchuRules },
  'plis-1d5bc6bb745d6ead49e9': {
    name: '3 樓自修室', ranges: [['0123456', '08:00', '18:00']], url: 'https://www.chunan.gov.tw/cp.aspx?n=11120',
  },
  'plis-79a601480d722cb58344': {
    name: '2 樓自修室', ranges: [['0123456', '08:00', '21:00']], url: 'https://www.chunan.gov.tw/cp.aspx?n=4539',
  },
  'plis-b19f4a632868ac1ed335': { name: '3 樓自習室', ranges: [['23456', '08:30', '20:20'], ['0', '08:30', '16:50']] },
  'plis-65e63bfdbf5ce145d999': { name: '3 樓自修室', ranges: [['23456', '09:00', '21:00'], ['0', '09:00', '17:00']] },
  'plis-f935063eced556c94ad8': { name: '自修室', ranges: [['2345', '08:30', '18:50'], ['06', '08:30', '16:50']] },
  'plis-66e53f44f93b7f476b11': { name: '自習室', ranges: [['023456', '08:00', '21:00']] },
  'plis-016c903b9ad9d1b886d6': { name: '讀者自修室', ranges: [['023456', '08:00', '21:00']] },
  'plis-e7aaecf3515c7452935c': { name: '自修室', ranges: [['2345', '08:30', '20:00'], ['06', '08:30', '17:00']] },
  'plis-57c550f79ce262c9b2d6': {
    name: '自修室', ranges: [['2', '09:00', '17:00'], ['03456', '08:00', '21:00']],
    url: 'https://www.tnpl.tn.edu.tw/u5023614168192137398/a1',
  },
  'plis-518cafd6d62c58eabe4d': {
    name: '3 樓自修室', ranges: [['2', '09:00', '17:00'], ['03456', '08:00', '21:00']],
    url: 'https://www.tnpl.tn.edu.tw/page/EachPavilionList.aspx',
  },
  'plis-e1e2bc4b4c8213751baa': {
    name: '自修室', ranges: [['2', '09:00', '17:00'], ['03456', '08:00', '21:00']],
    url: 'https://www.tnpl.tn.edu.tw/page/EachPavilionList.aspx',
  },
  'plis-1b4fab4fae6901d46c23': {
    name: 'B1 溫書窩', ranges: [['23456', '08:30', '21:00'], ['0', '08:30', '17:30']],
    url: 'https://www.tnpl.tn.edu.tw/n14721285094990013329/n1Content',
  },
  'plis-421acf277000ebf61419': { name: '自修室', ranges: [['23456', '08:00', '22:00'], ['0', '08:00', '17:00']] },
  'plis-b8bd9cf1d6684cef5d51': { name: '自修室', ranges: [['023456', '09:00', '20:00']] },
  'plis-387900bcde6ccbe06570': { name: '3 樓閱讀自習室', ranges: [] },
  'plis-3dc026b916c043fe287e': {
    name: '1 樓閱覽區（整修期間）', ranges: [['023456', '08:00', '17:00']],
    url: 'https://www.changkang.gov.tw/news/news1/detail/9834',
  },
  'plis-61f904e8f436ea8fc25d': {
    name: '3 樓自修室', ranges: [['1', '17:00', '20:00'], ['2345', '08:00', '20:00'], ['06', '08:00', '17:00']],
    url: 'https://ctrl.chcg.gov.tw/main/main_act3/main.aspx?act_id=45&main_id=3428',
  },
  'plis-3fb94b86e4de966ba65a': {
    name: '3 樓自修室', ranges: [['123456', '09:00', '20:00'], ['0', '09:00', '17:00']],
    url: 'https://content.yunlin.gov.tw/cp.aspx?n=994',
  },
  'plis-43bc851b4926b0b037f2': {
    name: '2 樓自修室', ranges: [['023456', '08:30', '17:00']],
    url: 'https://lib.ylccb.gov.tw/wSite/sp?ctNode=6218&mp=1&orgId=019&xdUrl=%2FwSite%2FApBlock%2FLibrary.jsp',
  },
  'plis-00bd1306ca6884693919': {
    name: '3 樓讀者自修區', ranges: [['23456', '09:00', '20:00'], ['0', '09:00', '17:00']],
    url: 'https://www.chcg.gov.tw/TSO/hemei/07other/main.aspx?main_id=1193',
  },
  'plis-21b90fd0847520bc7c74': {
    name: '4 樓自修區', ranges: [['2345', '08:30', '20:30'], ['06', '08:30', '17:30']],
    url: 'https://www.chcg.gov.tw/TSO/xianxi/07other/main.aspx?main_id=1986',
  },
  'plis-0fbff29cac66fc6527df': {
    name: '自修室', ranges: [['2345', '08:00', '21:00'], ['06', '08:00', '17:00']],
    url: 'https://files.chcg.gov.tw/files/彰化縣社頭鄉立圖書館圖書資料借閱規定(修正)_114_1090214.pdf',
  },
};

export function libraryStudyHours(id: string): { name: string; slots: Slot[] | null; url?: string } | undefined {
  const hours = studyHours[id];
  if (!hours) return;
  const slots = hours.ranges.flatMap(([days, start, end]) =>
    [...days].map((day) => ({ day: Number(day), start: minutes(start), end: minutes(end) })))
    .sort((first, second) => first.day - second.day || first.start - second.start);
  return { name: hours.name, slots: slots.length ? slots : null, url: hours.url };
}
