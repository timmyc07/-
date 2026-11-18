export default function LoadingSearch() {
  return <main className="shell route-loading" aria-busy="true">
    <h1>查詢自修空間</h1>
    <p role="status" className="visually-hidden">正在載入館舍</p>
    <div className="loading-search loading-surface" aria-hidden="true" />
    <div className="loading-cards" aria-hidden="true">
      {[0, 1, 2].map((card) => <div key={card} className="loading-card loading-surface"><span /><span /><span /></div>)}
    </div>
  </main>;
}
