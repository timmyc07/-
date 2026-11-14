# StudyGo｜臺中公立圖書館自修查詢

臺中市的公立公共圖書館是第一個驗收範圍。網站及匯入程式在本機執行，資料寫入 MongoDB 的 `studygo_dev`。在臺中的查詢與資料覆蓋完成驗收後，再開始其他縣市。

## 本機啟動

1. 安裝 Node.js 24，準備本機 MongoDB 或已有的 Atlas 開發叢集。
2. 在專案根目錄建立 `.env`，只設定必要的 MongoDB 連線資訊。例如本機預設埠可使用 `MONGODB_URI=mongodb://127.0.0.1:27017`。使用 Atlas 時，連線字串使用可寫入 `studygo_dev` 的開發帳號。
3. 執行以下指令，然後開啟 [StudyGo](http://127.0.0.1:3000) 與[資料狀態](http://127.0.0.1:3000/admin)。

```sh
npm ci
npm run import:taichung
npm run dev
```

匯入一次只更新臺中的資料快照。完整解析並檢查館舍、行政區和試點空間後才寫入，重跑更新同一份資料，抓取失敗時保留上一份。館舍名錄優先讀政府資料，館方官網用來補足新館、搬遷、分棟、自習室及公告。網站每次查詢都讀取 MongoDB 的當前快照。

已有臺中資料時，可執行 `npm run crawl:taichung-rules` 查核仍有缺漏的公立館舍。程式將館方公開頁面及候選文件存入 `.local/taichung-public-rule-audit.json`。下次匯入帶入查核狀態和文件連結，人工確認的使用規則由 `scripts/public-library-data.ts` 保存。

## 臺中資料與驗收

- 2026-11-12 的收錄範圍包含市圖總館、各分館、和平區立圖書館、國資圖總館及黎明分館。以國資圖公立公共圖書館開放資料對照市圖官網和市府聯絡資訊。精武採同一館舍紀錄，豐原分館依地址分列 A、B 棟。 [公共圖書館基本資料](https://data.gov.tw/dataset/99567) · [市圖館舍資訊](https://www.library.taichung.gov.tw/libraryinfo/index?Parser=99,3,68,32)
- [資料狀態](http://127.0.0.1:3000/admin)提供各行政區覆蓋情況和[逐館缺口 CSV](http://127.0.0.1:3000/admin/gaps)。自習室與一般閱覽區各自核對開放時間、入場和設備。和平區立圖書館的整館開放時間已有區公所公告，自習室獨立時段和入場仍待查。 [和平區立圖書館開館公告](https://www.heping.taichung.gov.tw/4086049/post) · [市圖自習區筆電規則](https://www.library.taichung.gov.tw/faq/Details?Parser=30,3,49,28,,,97)
- `npm test` 驗證時間、資格、休館、設備及匯入比對，`npm run check` 驗證型別，`npm run build` 驗證網站可建置。跨日查詢及尚無核對資料的年度，會分別顯示輸入提示或待確認。

### 臺中出發流程

- **附近查詢。** 選一間圖書館作為距離起點，或允許瀏覽器定位並送出目前條件。結果保留「符合條件／待確認／不符合」的優先順序，同一狀態內依直線距離排序。定位查詢網址含四捨五入至小數第三位的座標。館舍卡片可用已核對座標開啟 Google 地圖導航。 [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started)
- **備案。** 按館舍去重，最多顯示三間符合原條件的不同館舍。已有查詢起點時沿用該起點，否則從原定館舍計算距離。同區沒有符合的備案時，可一鍵擴大到全臺中市。
- **試點出發資訊。** 大墩、太平、國資圖總館的結果卡列出樓層、入座方式、充電規則、電話和官方來源。已確認符合的時段顯示當天可用到幾點。太平 B1 施工期間的使用情況及專室時段仍待館方確認。國資圖 B1 提供 iSpace 入口、實體借閱證與報到指引。 [大墩樓層導覽](https://www.library.taichung.gov.tw/lib/content/index?Parser=1%2C105%2C195) · [太平樓層導覽](https://www.library.taichung.gov.tw/lib/content/index?Parser=1%2C123%2C375) · [太平修繕進度](https://assess-public.taichung.gov.tw/ImportantWork/Detail/115DQ00007) · [國資圖 iSpace 教學](https://www.nlpi.edu.tw/StaticPage/ispace-tutorial)

本機驗收時，以 2026-11-15 14:00–16:00 查詢，選大甲分館為原定館，確認備案各屬不同館舍並按距離排序。再選大墩分館為距離起點或允許瀏覽器定位，確認距離及導航。分別查大墩、太平及國資圖總館的自修室，核對 B 棟 2 樓、太平 B1 待確認、國資圖 B1 刷證與預約入口。用 2026-11-28 查大墩確認休館理由及來源。

### 臺中自修室、座位插座與 2027 年休館查核

- 2026-11-14 查核涵蓋 **51 筆館舍、81 個空間**。後台列出 **207 項**館舍與空間欄位，包含 51 項 2027 年度休館表。仍有 26 項座位插座、20 項自修室時段及 5 項有無自修室待確認。
- **太平分館 B1。** 11 月 14 日 11:58 透過市圖官方 LINE 詢問施工期間是否開放、週二至週六與週日的固定時段、臨時調整日期。已收到非諮詢時段的自動回覆，待館員答覆。館方資料確認 B1 有 60 席，座位依市圖自習區規則不供充電。 [市圖官方聯絡方式](https://www.library.taichung.gov.tw/pmail/index?Parser=99,3,87,28,44) · [分館介紹](https://www.library.taichung.gov.tw/lib/Introduction/index?Parser=99,123,374) · [工程進度](https://assess-public.taichung.gov.tw/ImportantWork/Detail/115DQ00007) · [自習區規則](https://www.library.taichung.gov.tw/form/Details?Parser=2,3,48,28,,,204)
- **其他館舍。** 葫蘆墩文化中心單列 4 樓自修室，週二至週六 08:30–21:00，週日 08:30–17:30。大甲、清水、霧峰以文及石岡已補核對紀錄，專室時段仍待確認。上楓 20 席、龍井 17 席可充電的閱覽座位已補官方出版品來源。大肚、大肚瑞井及和平區立的座位充電仍待確認。 [葫蘆墩館室時段](https://www.huludun.taichung.gov.tw/content/index.asp?Parser=1,3,20) · [上楓館舍資料](https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000620) · [國資圖龍井復館訪查](https://www-old.nlpi.edu.tw/JournalDetailC003313.aspx?Cond=26ca6952-6617-452f-97e6-36e7bf0bef8b)
- **2027 年休館。** 查核時市圖官網仍列 2026 年度表，國資圖的 2027 年分頁尚無資料，和平區公所公告每週一及國定假日休館。豐原南嵩分館施工休館延續至 2027 年，館方預計 3 月復館，確切日期待公告。東勢許良宇圖書館及西區分館有跨年工程資料，服務異動待館方公告。 [市圖開放時間](https://www.library.taichung.gov.tw/content/index?Parser=1,3,72,32) · [國資圖休館日](https://www.nlpi.edu.tw/ServiceMail/feedback/Holiday) · [和平區公所公告](https://www.heping.taichung.gov.tw/4086049/post) · [南嵩分館施工休館公告](https://www.library.taichung.gov.tw/latestevent/Details?Parser=9,3,41,27,,,1628)
- **後台流程。** 跑 `npm run import:taichung` 後開啟 [逐欄核對與匯入異動](http://127.0.0.1:3000/admin/fields)，可按館舍、欄位及待確認狀態篩選。已核對的欄位顯示日期、紀錄和來源。人工核對資料保存在 `scripts/taichung-field-reviews.ts`，實際查詢規則依 `scripts/public-library-data.ts` 及匯入來源更新。異動記錄同時保存欄位前後值與證據，最多保留最近 20 批有變動的匯入。資料相同時重跑不新增紀錄。
- **本機驗收。** 匯入既有快照後執行新版匯入，在逐欄頁選太平分館核對 B1 時段、LINE 詢問紀錄和來源，再選「2027 年休館公告」與「待確認」核對 51 筆。展開匯入異動核對欄位前後值和證據，重跑同資料確認異動筆數為零。首頁查 2027-01-14 的豐原南嵩分館確認施工休館，同日查大墩確認年度公告待確認，再查 2026-11-15 的大墩自修室確認已知時段。

Atlas 的資料位置為 `studygo_dev.city_snapshots`，臺中快照的 `_id` 為 `taichung`。本機網站切換至 Atlas 時，只需以可存取此資料庫的 Atlas 連線字串更新本機 `.env` 的 `MONGODB_URI`，再重啟網站。 [MongoDB Atlas 連線說明](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)

實作使用 Next.js 16.4.6、MongoDB Node.js 驅動 7.8.0、Cheerio 1.2.0 與 CSV Parse 7.0.3。 [Next.js 16.4.6](https://github.com/vercel/next.js/blob/v16.4.6/docs/01-app/03-api-reference/03-file-conventions/page.mdx) · [MongoDB 驅動 7.8](https://mongodb.github.io/node-mongodb-native/7.8/classes/Collection.html) · [Cheerio 1.2.0](https://github.com/cheeriojs/cheerio/releases/tag/v1.2.0) · [CSV Parse 7.0.3](https://github.com/adaltas/node-csv/tree/csv-parse%407.0.3/packages/csv-parse)

## 全臺實作計劃

StudyGo 讓使用者依地區、距離起點、日期、開始時間、使用時長、入場資格和設備需求，查找可使用的自修與安靜閱覽空間。結果附上判定原因、官方來源、導航和備案，後續逐欄補上最後核對時間。網站先在本機開發與驗收，資料使用 MongoDB。

## 1. 收錄範圍

- 全臺 22 縣市含離島。收錄中央或地方政府設立的公立公共圖書館、分館及民眾閱覽室。按實體館舍建立紀錄，一館可有多個閱覽空間。學校及大專院校圖書館、私立館、專門圖書館、行動書車及單純自助借還書站排除。
- 第一批僅做臺中市。臺中功能與資料驗收後，才加入其他縣市。每個行政區提供館舍清單與資料缺口。館內有證件或預約要求的空間，依查詢者資格判定。
- 保留原企劃六項功能：指定時段、空間篩選、資格查核、設備篩選、休館異動、備案比較。預約提供館方入口，查詢判斷依官方規則與公告。

## 2. 資料來源與優先序

按欄位依序找中央及地方政府開放資料、館方公開下載或 API，再由爬蟲補齊館方公開網頁與公告。遇到有明確生效日期的館方異動公告，依公告範圍覆蓋原規則。

| 來源 | 使用方式 |
| --- | --- |
| [公共圖書館基本資料 #99567](https://data.gov.tw/dataset/99567) | 公立公共圖書館起始名錄，提供館名、地址、電話、網址與座標。用[公共圖書館資訊服務網名錄](https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/Index)逐筆對帳。 |
| [臺中公共館聯絡資訊](https://opendata.taichung.gov.tw/search/0a1206be-17be-43e7-a2a4-b86cec530506)、[臺北分館與閱覽室 #121431](https://data.gov.tw/dataset/121431)、[高雄分館 #170866](https://data.gov.tw/dataset/170866) | 補齊分館與聯絡資料。高雄資料另有開、閉館時間欄位，作為館舍時段來源。 |
| [臺中大墩分館空間導覽](https://www.library.taichung.gov.tw/lib/content/index?Parser=1%2C105%2C195)、[臺北市圖使用規則](https://tpml.gov.taipei/News_toggle.aspx?n=B64082F5678B94B1&sms=D0034AF4F8239B65) | 驗證分區時段、座位預約與報到、換證及訪客身分。臺中大墩分館有獨立自習室時段，可作為第一組查詢驗收案例。 |

每個欄位記錄來源網址、提供機關、授權或使用規範、抓取與核對時間，時段及規則另外記錄適用範圍與生效日期。依[政府資料開放授權條款第 1 版](https://data.gov.tw/license)保存來源標示。這次查到的全國名錄提供館舍底稿，自修空間、設備、使用資格與臨時休館仍須補資料。

## 3. 匯入與爬蟲

1. **建立館舍名冊。** 先匯入 #99567，再以地方名錄及館方官網補欄位和分館。保留原始資料鍵與館名別稱。優先採穩定的官方館碼，缺館碼時用館名、地址與行政區比對，再配發內部 ID。CSV 序號只供單次匯入追溯，合併疑義交由後台確認。
2. **按欄位找缺口。** 核對每館的樓層與空間、自修許可、每週時段、特殊期間及休館、證件與預約、筆電／Wi-Fi／插座。用館方公開連結找到規則頁、分館頁、公告及 PDF。按共用網站模板維護解析器，並保留各館適用範圍。
3. **抓取公開資料。** 從已確認的官方網址清單發出請求，依網站條款及 robots.txt 設定抓取範圍，同站低併發，遇 429 依 Retry-After 延後。靜態頁優先使用 HTTP 與 [Cheerio](https://github.com/cheeriojs/cheerio)。需要瀏覽器渲染的公開頁面再採 [Playwright](https://github.com/microsoft/playwright)。若多站點需要共用請求佇列與重試，採現成的 [Crawlee](https://github.com/apify/crawlee)。需要登入、禁止自動抓取、掃描版公告或無公開來源時，登記缺口與人工核對途徑。
4. **驗證後更新。** 統一館名、行政區、民國日期及時間格式，保留必要來源定位。使用來源 ID 與內容雜湊比對異動，再用穩定 ID 重跑匯入。解析失敗、資料筆數異常、來源互相衝突或欄位消失時，保留上次成功版本並標記受影響欄位待查，後台核對後才覆蓋。匯入記錄保留筆數、差異、失敗原因及處理進度。

## 4. MongoDB 與查詢

本機 Next.js／TypeScript 網站及匯入程式共用 MongoDB 驅動和規則模組。以獨立開發資料庫 `studygo_dev` 起步，使用既有 Atlas 環境時先驗證叢集、資料庫帳號、連線來源及讀寫。開發環境的必要連線資訊以 `MONGODB_URI` 存在本機 `.env`，爬取頻率、每站限速及來源開關由 admin 管理。Atlas 與本機 MongoDB 可用同一套匯入及驗收流程。MongoDB Server 與驅動版本在連線驗證時確認並固定。 [MongoDB Atlas 連線文件](https://www.mongodb.com/docs/atlas/driver-connection/)

| 集合 | 儲存內容 |
| --- | --- |
| `libraries` | 每個館舍一份文件，含穩定 ID、別名、管理機關、館種標籤、地區、地址、電話、網址、館舍營運狀態及核對狀態。 |
| `study_areas` | 每個空間一份文件，引用館舍 ID，內嵌有限的每週時段、特殊期間規則、使用資格、預約與設備狀態。開放時段及使用時間上限區分已知、明確無限制與待確認。 |
| `schedule_exceptions` | 單日或日期範圍的休館、臨時改時段，記錄作用於整館或某空間、公告日期、有效範圍與來源。 |
| `sources`、`import_runs` | 官方資料集、規則頁與公告、欄位證據、授權、匯入批次、內容雜湊、筆數與錯誤。 |

對館舍 ID、館舍內空間 ID 及來源鍵建立相應唯一索引。以縣市／行政區及館舍／例外日期索引縮小候選範圍，匯入與後台都做資料驗證。 [MongoDB 資料建模](https://www.mongodb.com/docs/manual/data-modeling/best-practices/) · [唯一索引](https://www.mongodb.com/docs/manual/core/index-unique/)

**判定順序**以 `Asia/Taipei` 計算使用區間。先套適用的臨時異動，再套特殊期間，最後套每週時段；整館休館作用於各空間，公告明列例外時依其範圍處理。只在館方明確說明時繼承館舍時段，並檢查整段是否連續涵蓋、連續使用上限、適用身分、證件、可接受的預約方式與必要設備。同級規則衝突時標示待確認。已知任一必要條件不符即回傳「不符合」與原因，所有必要條件有依據且滿足才回傳「符合」，其餘為「待確認」。備案使用相同條件並排除原館。

## 5. 里程碑與驗收

| 階段 | 交付與通過條件 |
| --- | --- |
| 1．本機基礎與全臺名錄 | 建立本機網站、匯入命令、MongoDB 開發庫及來源紀錄。#99567 及地方公立館舍名錄的適用紀錄可追溯至匯入、合併或待核對結果，22 縣市均可查詢。相同資料連匯兩次無重複，模擬匯入中斷後可重跑。 |
| 2．試點資料 | 先做臺中大墩、太平、國資圖總館，並在臺中市完成試點驗收。核對一般／特殊時段、跨區域設備、訪客換證、預約與臨時休館。每條會影響判定的試點規則都有官方來源，無法確認的欄位保留狀態。 |
| 3．查詢及出發流程 | 臺中已實作六項核心查詢、備案去重與距離排序、附近查詢、導航及三館出發資訊。後續補快捷時段、下一個符合的時段、公告與設備的逐欄核對日期。 |
| 4．全臺擴充 | 按縣市擴充公立公共圖書館，涵蓋離島。每批以中央與地方官方名單對帳，報告來源漏館、可能重複、已確認不開放及資料不足的館舍，並逐批核對。 |
| 5．維護與本機驗收 | 臺中後台已可逐欄核對自修室、時段、座位插座及 2027 年休館公告，並追蹤匯入前後的值與證據。後續加入單一來源重跑、公告更新排程、失敗重試與資料回復，再擴至其他縣市。 |

下一批先追蹤太平 B1 的館員回覆，取得施工期間的開放方式、固定時段及適用日期後更新查詢規則。接著複查新社及潭子復館後的自修空間，向大甲、清水、霧峰以文及石岡確認專室時段，向大肚、大肚瑞井及和平區立確認可充電的座位。追蹤市圖、國資圖及和平區立 2027 年休館表，並核對南嵩確切復館日期及東勢、西區施工服務異動。即時空位及未來可預約時段，以有公開或授權資料的館舍試點，各自標示資料來源和更新時間。臺中驗收完成後再擴至其他縣市。

全臺覆蓋以同一版官方名冊為分母，每筆館舍須有收錄、去重或待處理結果。規則核實率另以有對外使用可能性的館舍為分母，列出仍未確認的開放資格和資料欄位。上游未收錄、無公開資料或無法核對的館舍維持缺口狀態，避免把查得到館名誤報為已確認可自修。
