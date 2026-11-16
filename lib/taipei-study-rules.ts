import { minutes, type Area, type Closure, type Library } from './study.ts';

const taipeiRule = 'https://tpml.gov.taipei/News_Content.aspx?n=CD4793DE89132E89&s=9C9863C2224D9B5A';
const taipeiManualRule = 'https://tpml.gov.taipei/News_toggle.aspx?n=B64082F5678B94B1&sms=D0034AF4F8239B65';
const taipeiDirectory = 'https://tpml.gov.taipei/cp.aspx?n=1F9AED300D314011';
const taipeiWifiSource = 'https://data.taipei/dataset/detail?id=6aa6532d-652f-4c1b-814a-4646b75407af';
// Taipei Free 熱點名稱須指向館內自修空間，並與館舍地址相符。
const taipeiStudyWifi = new Set([
  'plis-b4f11997a2a0f56cc70b', 'plis-2795b0ebc2c7f0ecfff2', 'plis-8630492d73ce2487cd52',
  'plis-f5eea69421838b246a98', 'plis-1ce0f598d0b6a3cce1c1', 'plis-fc32748ba52020cb1222',
  'plis-ea82498c00171d923cac', 'plis-ae4afb661db999589383', 'plis-5d716f3883555860336b',
  'plis-c1eecc7328938e1f8113', 'plis-d14f3a24d79c22efd2da', 'plis-072a27cd0400a9041fe1',
  'plis-0ea807d14456081b105f', 'plis-89ca1a138e029a9ff0be', 'plis-6405f5727f01d0619cd9',
  'plis-4235a1e69db7bb767466', 'plis-114080cf8fa32977d08a', 'plis-7decf0dff68a9e8b198d',
  'plis-bdd0485b3b3e5b926023', 'plis-a41c03305803788dff81', 'plis-686aaa6ffb77e85fd5ad',
  'plis-c21ff2a6d5f510b7fccd', 'plis-a670c69b2a2a96a3d9fa', 'plis-c815a0be3c424a669f14',
  'plis-bb2ad3509d4bb274ef1e', 'plis-c5ebd4287161428dd45e', 'plis-963484c045b604f1e7cd',
  'plis-79c8541a02a760d57156', 'plis-edeec13b64c0ca4d0965', 'plis-744dd53a547fde48cb19',
  'plis-556af005b3614de06ca7', 'plis-0978ad84e2f92b807a42', 'plis-5ecb8740b96ead296d21',
  'plis-e0e7f601f41ffc98e2aa', 'plis-9f8e62981180e7c9a7d3', 'plis-e3287dc94a64c9288833',
]);
const newTaipeiRule = 'https://www.library.ntpc.gov.tw/singlehtml/e81f432c17614ea4b732e114c365e29b?cntId=26b1530a3e724f44892b6cb0c7c7c5ed';
const newTaipeiReadingRule = 'https://www.library.ntpc.gov.tw/singlehtml/e81f432c17614ea4b732e114c365e29b?cntId=d52799f735b74dafbb11ecb8b87a4360';
const studyConstruction: Record<string, { name: string; closure: Closure; sources?: string[] } | undefined> = {
  'plis-e560724330a3485ec121': {
    name: '3 樓自修室',
    closure: {
      from: '2026-06-08', until: '2026-06-09', reason: '3 樓自修室因內部空間調整暫停開放。',
      url: 'https://www.library.ntpc.gov.tw/%3Bjsessionid%3DB6432A57A0B1AC7AAA2FBC31D8DD2C45',
    },
  },
  'plis-6178fec7a54e55fdd3ff': {
    name: '3 樓自修室',
    closure: {
      from: '2026-08-17', until: '2026-12-10', reason: '3 樓自修室空調汰換暫停開放，5 樓閱覽區正常開放。',
      url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=4b6ca6a6c78b4023b544f4c5e8b69b2d',
    },
  },
  'plis-e1f47e046250c8795b4f': {
    name: '5 樓自修室',
    closure: {
      from: '2026-10-12', until: '2026-11-14', reason: '5 樓空調汰換暫停開放，11 月 15 日提前恢復。',
      url: 'https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=b47b17fa993d4cd29cc8d73f72d5d085',
    },
    sources: ['https://www.library.ntpc.gov.tw/singlehtml/Info?cntId=8a5229ac1d3f453a8d50b87469c3fba8'],
  },
};
const taipeiReservation = new Set([
  'plis-b4f11997a2a0f56cc70b', 'plis-e3287dc94a64c9288833', 'plis-c21ff2a6d5f510b7fccd',
  'plis-7decf0dff68a9e8b198d', 'plis-0ea807d14456081b105f', 'plis-d14f3a24d79c22efd2da',
]);
const branchSeats: Record<string, { count?: number; name?: string; note?: string; url: string; poweredSeats?: string; laptopSeats?: string; wifi?: true } | undefined> = {
  'plis-2795b0ebc2c7f0ecfff2': { count: 45, name: '3 樓自修座位',
    laptopSeats: '自修座位均可使用筆電或平板。',
    url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=84CAF73F014CA323&sms=CFFFC938B352678A' },
  'plis-1dee29e3f2257c15c1cd': {
    count: 140,
    name: '2 樓自修區',
    note: '樓層表列 140 席自修及閱覽座位，館舍簡介另載館內約 130 席。',
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=2d2c7ab867e4497d96de4a0e51b8b441',
  },
  'plis-fbb1ce331b5c4abb48de': { count: 71, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=ddbda146780e487ca541d6611329c3b2' },
  'plis-12e793940725863678f5': { count: 32, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=a259391449d441c1afd5a9417a92f83d' },
  'plis-f4c982bf00e091bcc667': { count: 24, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=cd2a297d0eb643d8a4457e00a49e507e' },
  'plis-5f86e9631601d52f3f76': { count: 54, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=640ede611fd64e6f88940755d02920dc' },
  'plis-6f98b89ad15a79a64dc6': { count: 24, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=0b590090e20c4a76801f4e7968579483' },
  'plis-c488aeda8f5a5cec86b1': { count: 123, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=60713de7e75a4a6dbdd45deaf4d5c44e' },
  'plis-4d0d0cfbe3a9cd856174': { count: 29, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=41e3b0e869974d39a3f9b5251bacc94b' },
  'plis-fbaad21dca36d8e7e69b': { count: 91, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=75c9e134b56247d1be0b12771f4c958c' },
  'plis-e560724330a3485ec121': { count: 127, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=7ab6eefb8a0542c591c242c79fb36989' },
  'plis-ec1367a16695c5bd68b2': { count: 144, laptopSeats: '6 樓自修室有 18 席筆電使用區。', url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=33f18ef4a9ae47908a4d55bb0a2c6dc0' },
  'plis-dce1cb93599d11a23eb5': { count: 90, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=e1b1790a484745859ac130f5cdd37390' },
  'plis-28504a6154ab9f4b992f': { count: 132, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=ebe088bf10034b7b9ae840ce7495e4fd' },
  'plis-c770870780f2e3994cd2': { count: 104, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=5cbaf24850354822b32b7907ef7945b3' },
  'plis-2d54a2fbad4e1969f16d': { count: 65, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=194d0fedaca34b6b8d425d9bf0d6e405' },
  'plis-8c917529e3822d3a0ece': { count: 40, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=dea0fa5bfa8c4196b7f594c5419f135a' },
  'plis-5e3e0d107165abbc64e5': { count: 135, wifi: true, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=bfc1b820203c4aae9ea7cf4d99827c87' },
  'plis-aa077d31f651076b59ef': { count: 80, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=04181df4e197467da4590313553f6188' },
  'plis-e3287dc94a64c9288833': { count: 82, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=E9D3E1E398ACCE44' },
  'plis-79c8541a02a760d57156': { count: 24, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=9B5CA23B4B7D3E6E' },
  'plis-89ca1a138e029a9ff0be': { count: 96, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=868FFBF7DB389D6E' },
  'plis-686aaa6ffb77e85fd5ad': { count: 72, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=26CFD64C53EF0B8A' },
  'plis-4235a1e69db7bb767466': { count: 93, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=10C7F7FA14863BD4' },
  'plis-f5eea69421838b246a98': { count: 49, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=139B11B3FE27F959' },
  'plis-7decf0dff68a9e8b198d': { count: 195, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=8FF5DB94BBB09AA3' },
  'plis-d14f3a24d79c22efd2da': { count: 78, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=3CC8123A170A9E1A' },
  'plis-8b76b5bd5da364ef7614': { count: 148, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=1E9530A402DE3FE4' },
  'plis-ea82498c00171d923cac': { count: 128, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=C0D0D7D8512FBA69' },
  'plis-114080cf8fa32977d08a': { count: 216, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=4643DE8A8785BFD0' },
  'plis-bb2ad3509d4bb274ef1e': { count: 112, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=D3079BF04FC7C57E' },
  'plis-c1eecc7328938e1f8113': { count: 108, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=C74FF235C1C51515' },
  'plis-5ecb8740b96ead296d21': { count: 60, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=30079DE895A0CE6A' },
  'plis-c5ebd4287161428dd45e': { count: 90, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=F0D10AC6B9A2034F' },
  'plis-8630492d73ce2487cd52': { count: 50, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=9705A783EC7DAA93' },
  'plis-c21ff2a6d5f510b7fccd': { count: 194, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=DF81EFDE49CD311A' },
  'plis-556af005b3614de06ca7': { count: 100, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=C6F658AB460A6821' },
  'plis-4a5392763b505085c4b0': { count: 82, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=9D5E05FD2EDBBA72' },
  'plis-0978ad84e2f92b807a42': { count: 24, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=1DAF842352008AB0' },
  'plis-963484c045b604f1e7cd': { count: 100, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=3E701CBF09B9DE91' },
  'plis-6405f5727f01d0619cd9': { count: 84, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=91DF3FAE1633F461' },
  'plis-1ce0f598d0b6a3cce1c1': { count: 80, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=2F9356134BAA10BC' },
  'plis-e32d363e2994cce524f7': { count: 56, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=9653DABCE4761B8E' },
  'plis-e0e7f601f41ffc98e2aa': { count: 82, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=BCC8C69F6DCC9602' },
  'plis-5d716f3883555860336b': { count: 102, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=C574D9996116CFA1' },
  'plis-9f8e62981180e7c9a7d3': { count: 48, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=6CE4E65B3438B4F7' },
  'plis-072a27cd0400a9041fe1': { count: 36, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=50DF61E26C3A0BFA' },
  'plis-ae4afb661db999589383': { count: 56, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=4B8B65E4D1706DE2' },
  'plis-a146c2d061529bbf111d': { count: 120, wifi: true, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=832D048C62A0F697' },
  'plis-a670c69b2a2a96a3d9fa': { count: 196, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=AEF69C260CB4B876' },
  'plis-c815a0be3c424a669f14': { count: 268, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=4EEDC7CB3FB6C19E' },
  'plis-0ea807d14456081b105f': { count: 93, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=92FAAE794AC2B476' },
  'plis-3c8e68ee422733123905': { count: 82, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=FB486AC6B571E022&sms=CFFFC938B352678A' },
  'plis-5ca7b8662f3ee724afdb': { count: 160, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=dc82ae43841f4a7580a7da987fe9635a' },
  'plis-2f2978ce3cdb2b79f6ef': { count: 60, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=87f7f5405b8a4695beea62e6c03d26bd' },
  'plis-4d33d19b31ac419fb05c': { count: 266, note: '木桌區內兩間筆電專區共 17 席，設有插座。館方未說明這 17 席是否計入 266 席自修席位。',
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=1b67994e4e43456aa83d84350bc3301e' },
  'plis-c919871190687b80121b': { count: 90, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=c5ce4004327d4cc6b186029af9f34309' },
  'plis-bd1ae9a8fe9b769cd7e7': { count: 30, poweredSeats: '自修閱覽區設有筆電區、插座及無線網路。', wifi: true,
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=a0aa6231771f4746b8523c02ee652977' },
  'plis-2a4837295385011e4ddd': { count: 200, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=745e63896b6b47ff8d4890d3e6712fdc' },
  'plis-cb68ee849f5f2568cdd2': { count: 46, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=ca791bf6b31b4387a33de24302dab1ca' },
  'plis-45e2769173fd5cf565ff': { count: 40, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=4165559dd5364dd597f393274d303ea1' },
  'plis-49a9a08d63a7140714e4': { count: 48, poweredSeats: '部分座位設有筆電插座。',
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=b1ae93fdc1244b80b9af364596b2b581' },
  'plis-bb7748d0af74c7cc9180': { count: 117, poweredSeats: '3 樓前方筆電區有 28 席及插座，後方有 89 席一般自修座位。',
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=aba549eae1a442e6a92fa8a13bd41110' },
  'plis-fc879c8531bf43aae2ef': { count: 87, poweredSeats: '5 樓自修室有 37 席附插座的筆電專用席。',
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=72c906c3d3d442fc97e106b9ed55317b' },
  'plis-e752f17584f7d20990de': { count: 160, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=92d029aa58d74f8d9501e8fcef484253' },
  'plis-11aa3de99bcc8b6d545d': { count: 200, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=9f0519c89e75453a824b949308a1ed03' },
  'plis-b5da9bcc084818ab9965': { count: 52, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=f97aa14cccf645d29276a969bc9d8c53' },
  'plis-ebb42497618c005f1223': { count: 159, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=dc88121272914791be0c19deef10053b' },
  'plis-6178fec7a54e55fdd3ff': { count: 170, wifi: true, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=12a6af39e58141d48e4af250720ba636' },
  'plis-b096b4bf57169ce03390': { count: 84, poweredSeats: '自修閱覽區設有筆電優先席、插座和無線網路。', wifi: true,
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=d08f04bf0cb34b41a12cdacb223b468f' },
  'plis-b3c324c71459423ffadb': { count: 22, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=c159de7c56fb4a028afc2074e681cc4f' },
  'plis-a40a9a0b96d74b54147e': { count: 69, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=3b882237569f42d3a610b8ccca388ae1' },
  'plis-6a5fcd9a247ae993c036': { count: 288, poweredSeats: '3 樓自修及閱覽區合計約 288 席，設有 3C 優先席、插座及無線網路。', wifi: true,
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=88af75ac838f4c518e0b46e351323e78' },
  'plis-c91fb11bd56bbbfda65a': { count: 24, laptopSeats: '自修區設有筆電使用區。館方樓層表列 24 席，分館簡介另列 38 席。',
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=37914dcbf04f454e91bad2aa085ef688' },
  'plis-49c73b57188489998e49': { name: '4 樓開放式景觀閱讀區',
    poweredSeats: '區內電腦及自修座位合計 26 席，提供插座供自備設備使用。',
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=707cf3fbd7b549aab651bee868612fb1' },
  'plis-5946ac04ea837232b6f2': { count: 38, laptopSeats: '4 樓自修室可自備筆電。', url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=05bf4bb286764b73a497592be0c58b96' },
  'plis-9de55bfc56b18ae1f99a': { count: 53, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=ed45e89a66b64e40aa16299a33c86710' },
  'plis-2b5fb60dcc3812c8a2a4': { count: 12, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=4baa16dffd7c409db3b920fc352548d0' },
  'plis-039d55a9f83160fc0e08': { count: 140, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=e981c14a1847473c8d038b4c19656eab' },
  'plis-52b31760b5c01701738f': { wifi: true, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=87666d0966844572bc4bf24c9f706ed4' },
};

export function taipeiStudyRoom(library: Library, area: Area, listed: boolean): Area | undefined {
  const seats = branchSeats[library.id];
  const hotspot = taipeiStudyWifi.has(library.id);
  const withSeats = {
    ...area,
    name: seats?.name ?? area.name,
    ...(seats?.count !== undefined ? { seats: seats.count } : {}),
    equipment: hotspot || seats?.wifi ? { ...area.equipment, wifi: true } : area.equipment,
    sources: [...area.sources, ...(seats ? [seats.url] : []), ...(hotspot ? [taipeiWifiSource] : [])],
  };
  const standardSlots = area.slots ?? Array.from({ length: 7 }, (_, day) => ({
    day, start: minutes(day <= 1 ? '09:00' : '08:30'), end: minutes(day <= 1 ? '17:00' : '21:00'),
  }));
  if (taipeiReservation.has(library.id)) {
    return {
      ...withSeats, access: 'card', regionalCard: 'taipei',
      reservation: 'https://seat.tpml.edu.tw/sm/home_web.do#',
      entryNote: '持臺北市圖個人借閱證。當日席現場登記，次日起 7 日內可線上預約。國定假日及每月第一個星期四休館。',
      slots: standardSlots,
      sources: [...withSeats.sources, taipeiRule],
    };
  }
  if (library.id === 'plis-d4a372e3044256cc569b' || library.id === 'plis-235cf5117c19f3df0087') {
    return { ...withSeats, name: '自修區', slots: standardSlots,
      ...(library.id === 'plis-d4a372e3044256cc569b' ? { seats: 4 } : {}),
      sources: [...withSeats.sources, ...(library.website ? [library.website] : []), taipeiManualRule] };
  }
  const taipeiListed = ['plis-2795b0ebc2c7f0ecfff2', 'plis-edeec13b64c0ca4d0965',
    'plis-744dd53a547fde48cb19'].includes(library.id);
  if (library.name.startsWith('臺北市立圖書館') && (listed || seats || taipeiListed)
    && !['plis-0a7bdfab9e0c217b4951', 'plis-a52a74385fa7b184d15f'].includes(library.id)) {
    return {
      ...withSeats, slots: standardSlots, access: 'walk-in',
      equipment: seats?.laptopSeats ? { ...withSeats.equipment, laptop: true } : withSeats.equipment,
      entryNote: '平日自由入座。例假日、寒暑假或考季，館方得於開館前發放號碼牌，並可能查驗借閱證。'
        + (seats?.laptopSeats ?? ''),
      sources: [...withSeats.sources, taipeiManualRule, ...(taipeiListed ? [taipeiDirectory] : [])],
    };
  }
  if (library.id === 'plis-ebb42497618c005f1223') {
    return {
      ...withSeats, access: 'card', regionalCard: 'newTaipei', equipment: { outlet: false },
      entryNote: '持新北市圖個人借閱證在館內機台登記，並於 15 分鐘內刷證入場。157 席一般座位及 2 席身障專用座位。'
        + '離座逾 1 小時會取消原登記。週一至週五 08:30–20:30 為安靜閱讀區時段，禁止使用筆電、計算機及會發出干擾聲響的設備。',
      sources: [...withSeats.sources, newTaipeiRule],
    };
  }
  if ((listed || seats) && library.name.startsWith('新北市立圖書館')) {
    const conflictingOutlet = library.id === 'plis-2a4837295385011e4ddd';
    const construction = studyConstruction[library.id];
    return {
      ...withSeats, access: 'walk-in',
      ...(construction ? { name: construction.name, closures: [construction.closure] } : {}),
      equipment: { ...withSeats.equipment,
        ...(seats?.poweredSeats || seats?.laptopSeats ? { laptop: true } : {}),
        ...(conflictingOutlet ? {} : { outlet: Boolean(seats?.poweredSeats) }) },
      entryNote: '現場入座，每人限一席，請勿預佔。館方得於開館前發放號碼牌，請依序領牌入座。'
        + '暫離以 1 小時為限，館方會巡查，首次發現會放置巡查單，第二次巡查得清空座位。'
        + (conflictingOutlet ? '分館介紹與自修室管理要點的充電資訊不同，請向館方確認。'
          : seats?.poweredSeats ?? seats?.laptopSeats ?? seats?.note ?? ''),
      sources: [...withSeats.sources, newTaipeiRule, newTaipeiReadingRule,
        ...(construction ? [construction.closure.url, ...(construction.sources ?? [])] : [])],
    };
  }
  return seats ? withSeats : undefined;
}
