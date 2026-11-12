# StudyGo｜臺中圖書館自修查詢

臺中市是第一個驗收範圍。網站及匯入程式在本機執行，資料寫入 MongoDB 的 `studygo_dev`。在臺中的查詢與資料覆蓋完成驗收後，再開始其他縣市。

## 本機啟動

1. 安裝 Node.js 24，準備本機 MongoDB 或已有的 Atlas 開發叢集。
2. 在專案根目錄建立 `.env`，只設定必要的 MongoDB 連線資訊。例如本機預設埠可使用 `MONGODB_URI=mongodb://127.0.0.1:27017`。使用 Atlas 時，連線字串使用可寫入 `studygo_dev` 的開發帳號。
3. 執行以下指令，然後開啟 [StudyGo](http://127.0.0.1:3000) 與[資料狀態](http://127.0.0.1:3000/admin)。

```sh
npm ci
npm run crawl:taichung-directory
npm run crawl:taichung-sites
npm run import:taichung
npm run dev
```

匯入一次只更新臺中的資料快照。完整解析並檢查館舍、行政區和試點空間後才寫入，重跑更新同一份資料，抓取失敗時保留上一份。館舍名錄優先讀政府資料，館方官網用來補足新館、搬遷、分棟、自習室及公告。網站每次查詢都讀取 MongoDB 的當前快照。

已有臺中資料時，可先執行 `npm run crawl:taichung-rules` 查核仍有缺漏的館舍。它優先處理自修空間規則，透過教育部名錄尋找校方網站，把公開頁面和可能相關的文件存到 `.local/taichung-rule-audit.json`。下次匯入會帶入查核狀態。經核對的規則記在 `scripts/taichung-rule-reviews.ts`，作為可重跑的匯入來源。 [國中小圖書館概況](https://data.gov.tw/dataset/40119) · [高中圖書館概況](https://data.gov.tw/dataset/40115)

## 臺中資料與驗收

- 2026-11-12 整合臺中 29 個行政區、478 筆館舍。來源包括國圖臺中名錄及 475 筆館舍詳情、46 筆市府聯絡資訊、51 筆公共館開放資料和 47 個市圖館舍入口。比對國圖線上詳情修正舊 CSV 的缺字，並依館方現址保留綠美圖及豐原分館 A、B 棟的資料。 [國圖線上名錄](https://libstat.ncl.edu.tw/libraryData/search) · [公共圖書館基本資料](https://data.gov.tw/dataset/99567)
- 國圖詳情補齊公開館況、總機、網址及自修室有無。另檢查 371 筆政府及學校館方網址，保留可定位的規則與待查狀態。自修室獨立時段、校外訪客條件及設備以館方公開規則為準。 [市圖自習區筆電規則](https://www.library.taichung.gov.tw/faq/Details?Parser=30,3,49,28,,,97) · [市圖無線網路](https://www.library.taichung.gov.tw/faq/Details?Parser=30,3,49,28,,,67)
- 學校聯絡資料優先以教育部 115 學年名錄和特殊教育學校名錄補足，需同時核對校名與地址。館舍專線或專頁缺漏時，使用能確認的校方總機或校網。另核對部分大學和學校共讀站的訪客資格，以及豐原分館 A 棟重新開館、B 棟一般閱覽區和和平區立圖書館的開館資訊。 [國小名錄](https://data.gov.tw/dataset/6087) · [國中名錄](https://data.gov.tw/dataset/6088) · [豐原 A 棟重新開館](https://www.library.taichung.gov.tw/active/details?Parser=9%2C3%2C39%2C27%2C%2C%2C25595) · [和平區立圖書館開館公告](https://www.heping.taichung.gov.tw/4086049/post)
- 在[資料狀態](http://127.0.0.1:3000/admin)可依行政區查看覆蓋情況，並[下載逐館缺口 CSV](http://127.0.0.1:3000/admin/gaps)。例如，太平分館有自習室與設備證據，其獨立時段仍待館方核實。對外使用規則無法查證的館舍保留待確認。 [太平分館官方資料](https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/LibraryDetail?LIID=Lib0000226)
- `npm test` 驗證時間、資格、休館、設備及匯入比對，`npm run check` 驗證型別，`npm run build` 驗證網站可建置。跨日查詢及尚無核對資料的年度，會分別顯示輸入提示或待確認。

Atlas 的資料位置為 `studygo_dev.city_snapshots`，臺中快照的 `_id` 為 `taichung`。本機網站切換至 Atlas 時，只需以可存取此資料庫的 Atlas 連線字串更新本機 `.env` 的 `MONGODB_URI`，再重啟網站。 [MongoDB Atlas 連線說明](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)

實作使用 Next.js 16.4.6、MongoDB Node.js 驅動 7.8.0、Cheerio 1.2.0 與 CSV Parse 7.0.3。 [Next.js 16.4.6](https://github.com/vercel/next.js/blob/v16.4.6/docs/01-app/03-api-reference/03-file-conventions/page.mdx) · [MongoDB 驅動 7.8](https://mongodb.github.io/node-mongodb-native/7.8/classes/Collection.html) · [Cheerio 1.2.0](https://github.com/cheeriojs/cheerio/releases/tag/v1.2.0) · [CSV Parse 7.0.3](https://github.com/adaltas/node-csv/tree/csv-parse%407.0.3/packages/csv-parse)

## 全臺實作計劃

StudyGo 讓使用者依地區、日期、開始時間、使用時長、入場資格和設備需求，查找可使用的自修與安靜閱覽空間。結果附上判定原因、官方來源、最後核對時間和備案。網站先在本機開發與驗收，資料使用 MongoDB。

## 1. 收錄範圍

- 全臺 22 縣市含離島。收錄可從官方資料辨識的國家圖書館、公共圖書館及分館、民眾閱覽室、大專校院與中小學圖書館、專門及私立圖書館。按實體館舍建立紀錄，同一館舍可有多個館種標籤及多個閱覽空間。
- 第一批僅做臺中市。臺中功能與資料驗收後，才加入其他縣市。最終各館種均有名錄與資料缺口清單。已確認僅限特定身分的館仍可查到，備案推薦依查詢者資格判定。
- 保留原企劃六項功能：指定時段、空間篩選、資格查核、設備篩選、休館異動、備案比較。預約提供館方入口，查詢判斷依官方規則與公告。

## 2. 資料來源與優先序

按欄位依序找中央及地方政府開放資料、館方公開下載或 API，再由爬蟲補齊館方公開網頁與公告。遇到有明確生效日期的館方異動公告，依公告範圍覆蓋原規則。

| 來源 | 使用方式 |
| --- | --- |
| [國家圖書館圖書館名錄 #8306](https://data.gov.tw/dataset/8306) | 全館種起始名錄，提供館名、縣市、行政區、地址及館種。實測下載的 CSV 用 CP950 解碼，包含 22 縣市、5,207 筆原始紀錄，匯入後再去重與對帳。 |
| [公共圖書館基本資料 #99567](https://data.gov.tw/dataset/99567) | 公立公共館的電話、網址、經緯度等補充欄位。資料頁可讀，JSON 端點本次測試逾時。匯入時可改用可取得的政府來源，並用[公共圖書館資訊服務網名錄](https://plisnet.nlpi.edu.tw/Frontend/LibraryFamily/Index)逐筆對帳。 |
| [臺中公共館聯絡資訊](https://opendata.taichung.gov.tw/search/0a1206be-17be-43e7-a2a4-b86cec530506)、[臺北分館與閱覽室 #121431](https://data.gov.tw/dataset/121431)、[高雄分館 #170866](https://data.gov.tw/dataset/170866) | 補齊分館與聯絡資料。高雄資料另有開、閉館時間欄位，作為館舍時段來源。 |
| [國圖線上名錄](https://libstat.ncl.edu.tw/libraryData/search)、[大專校院圖書館統計 #6288](https://data.gov.tw/dataset/6288)、[高中圖書館概況 #40115](https://data.gov.tw/dataset/40115) | 用線上名錄匯出、校別資料及主管機關名單，交叉查核館種、學校與獨立館舍。校別統計用於對帳，實體館舍及使用規則由各校官方資料確認。 |
| [臺中大墩分館空間導覽](https://www.library.taichung.gov.tw/lib/content/index?Parser=1%2C105%2C195)、[臺北市圖使用規則](https://tpml.gov.taipei/News_toggle.aspx?n=B64082F5678B94B1&sms=D0034AF4F8239B65)、[臺大總圖校外讀者 FAQ](https://faq.lib.ntu.edu.tw/node/66) | 驗證分區時段、座位預約與報到、換證及訪客身分。臺中大墩分館有獨立自習室時段，可作為第一組查詢驗收案例。 |

每個欄位記錄來源網址、提供機關、授權或使用規範、抓取與核對時間，時段及規則另外記錄適用範圍與生效日期。依[政府資料開放授權條款第 1 版](https://data.gov.tw/license)保存來源標示。這次查到的全國名錄提供館舍底稿，自修空間、設備、使用資格與臨時休館仍須補資料。

## 3. 匯入與爬蟲

1. **建立館舍名冊。** 先匯入 #8306，再以地方名錄及 #99567 補欄位和分館。保留原始資料鍵與館名別稱。優先採穩定的官方館碼，缺館碼時用館名、地址與行政區比對，再配發內部 ID。CSV 序號只供單次匯入追溯，合併疑義交由後台確認。
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
| 1．本機基礎與全臺名錄 | 建立本機網站、匯入命令、MongoDB 開發庫及來源紀錄。#8306 每一列均可追溯至匯入、合併或待核對結果，22 縣市均可查詢。相同資料連匯兩次無重複，模擬匯入中斷後可重跑。 |
| 2．試點資料 | 先做臺中大墩、太平、國資圖總館，並在臺中市完成試點驗收。核對一般／特殊時段、跨區域設備、訪客換證、預約與臨時休館。每條會影響判定的試點規則都有官方來源，無法確認的欄位保留狀態。 |
| 3．六項查詢功能 | 本機完成需求表單、結果、館舍與空間明細、不符合原因、備案比較。測試日期邊界、午間中斷、休館覆蓋、特定日期改時段、訪客限制、未知插座、預約限制與資料過期。用試點官方資料手動對照主要結果。 |
| 4．全臺擴充 | 按縣市擴充公共館與離島，再按館種補齊學校、專門及私立館。每批以中央與地方官方名單對帳，報告來源漏館、可能重複、已確認不開放及資料不足的館舍，並逐批核對。 |
| 5．維護與本機驗收 | admin 可檢視待補資料、審核來源差異及手動重跑單一來源。匯出各縣市 × 館種的官方名冊筆數、唯一館舍數、開放資格與規則核實數，以及待確認原因。使用本機排程試跑公告更新、失敗重試及資料回復。 |

全臺覆蓋以同一版官方名冊為分母，每筆館舍須有收錄、去重或待處理結果。規則核實率另以有對外使用可能性的館舍為分母，列出仍未確認的開放資格和資料欄位。上游未收錄、無公開資料或無法核對的館舍維持缺口狀態，避免把查得到館名誤報為已確認可自修。
