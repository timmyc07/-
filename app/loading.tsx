export default function Loading() {
  return <main className="shell route-loading" aria-busy="true">
    <p role="status" className="visually-hidden">正在載入頁面</p>
    <div className="loading-hero loading-surface" aria-hidden="true">
      <span /><span /><span />
    </div>
  </main>;
}
