import { minutes, type Area, type Library } from './study.ts';

const taipeiRule = 'https://tpml.gov.taipei/News_Content.aspx?n=CD4793DE89132E89&s=9C9863C2224D9B5A';
const newTaipeiRule = 'https://www.library.ntpc.gov.tw/singlehtml/e81f432c17614ea4b732e114c365e29b?cntId=26b1530a3e724f44892b6cb0c7c7c5ed';
const taipeiReservation = new Set([
  'plis-b4f11997a2a0f56cc70b', 'plis-e3287dc94a64c9288833', 'plis-c21ff2a6d5f510b7fccd',
  'plis-7decf0dff68a9e8b198d', 'plis-0ea807d14456081b105f', 'plis-d14f3a24d79c22efd2da',
]);
const branchSeats: Record<string, { count: number; url: string; poweredSeats?: string; wifi?: true } | undefined> = {
  'plis-0ea807d14456081b105f': { count: 93, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=92FAAE794AC2B476' },
  'plis-3c8e68ee422733123905': { count: 82, url: 'https://tpml.gov.taipei/News_Content.aspx?n=4F66F55F388033A7&s=FB486AC6B571E022&sms=CFFFC938B352678A' },
  'plis-5ca7b8662f3ee724afdb': { count: 160, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=dc82ae43841f4a7580a7da987fe9635a' },
  'plis-2f2978ce3cdb2b79f6ef': { count: 60, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=87f7f5405b8a4695beea62e6c03d26bd' },
  'plis-4d33d19b31ac419fb05c': { count: 266, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=1b67994e4e43456aa83d84350bc3301e' },
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
  'plis-d9870072fabe0dbffb74': { count: 162, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=5e4f32adbc9247199415370f12f3326a' },
  'plis-b096b4bf57169ce03390': { count: 84, poweredSeats: '自修閱覽區設有筆電優先席、插座和無線網路。', wifi: true,
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=d08f04bf0cb34b41a12cdacb223b468f' },
  'plis-b3c324c71459423ffadb': { count: 22, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=c159de7c56fb4a028afc2074e681cc4f' },
  'plis-a40a9a0b96d74b54147e': { count: 69, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=3b882237569f42d3a610b8ccca388ae1' },
  'plis-6a5fcd9a247ae993c036': { count: 288, poweredSeats: '3 樓自修及閱覽區合計約 288 席，設有 3C 優先席、插座及無線網路。', wifi: true,
    url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=88af75ac838f4c518e0b46e351323e78' },
  'plis-5946ac04ea837232b6f2': { count: 38, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=05bf4bb286764b73a497592be0c58b96' },
  'plis-9de55bfc56b18ae1f99a': { count: 53, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=ed45e89a66b64e40aa16299a33c86710' },
  'plis-2b5fb60dcc3812c8a2a4': { count: 12, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=4baa16dffd7c409db3b920fc352548d0' },
  'plis-039d55a9f83160fc0e08': { count: 140, url: 'https://www.library.ntpc.gov.tw/branch/libraryBranch/detail/8aa9646575074db0a99c641a5f029ddb?branchId=e981c14a1847473c8d038b4c19656eab' },
};

export function taipeiStudyRoom(library: Library, area: Area, listed: boolean): Area | undefined {
  const seats = branchSeats[library.id];
  const withSeats = seats ? { ...area, seats: seats.count, sources: [...area.sources, seats.url] } : area;
  if (taipeiReservation.has(library.id)) {
    return {
      ...withSeats, access: 'card', regionalCard: 'taipei',
      reservation: 'https://seat.tpml.edu.tw/sm/home_web.do#',
      entryNote: '持臺北市圖個人借閱證。當日席現場登記，次日起 7 日內可線上預約。國定假日及每月第一個星期四休館。',
      slots: Array.from({ length: 7 }, (_, day) => ({
        day, start: minutes(day <= 1 ? '09:00' : '08:30'), end: minutes(day <= 1 ? '17:00' : '21:00'),
      })),
      sources: [...withSeats.sources, taipeiRule],
    };
  }
  if (library.id === 'plis-ebb42497618c005f1223') {
    return {
      ...withSeats, access: 'card', regionalCard: 'newTaipei', equipment: { outlet: false },
      entryNote: '持新北市圖個人借閱證在館內機台登記，並於 15 分鐘內刷證入場。157 席一般座位及 2 席身障專用座位。',
      sources: [...withSeats.sources, newTaipeiRule],
    };
  }
  if ((listed || seats) && library.name.startsWith('新北市立圖書館')) {
    const conflictingOutlet = library.id === 'plis-2a4837295385011e4ddd';
    return {
      ...withSeats, access: 'walk-in',
      equipment: seats?.poweredSeats ? { laptop: true, outlet: true, wifi: seats.wifi } : conflictingOutlet ? {} : { outlet: false },
      entryNote: conflictingOutlet
        ? '現場入座。分館介紹與自修室管理要點的充電資訊不同，請向館方確認。'
        : '現場入座，館方得於開館前發放號碼牌。' + (seats?.poweredSeats ?? ''),
      sources: [...withSeats.sources, newTaipeiRule],
    };
  }
  return seats ? withSeats : undefined;
}
