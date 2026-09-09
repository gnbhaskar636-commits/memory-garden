export function MemoryWorldLoading() {
  return (
    <div className="mw-loading" role="status" aria-live="polite">
      <div className="mw-loading-seed-wrap">
        <div className="mw-loading-ring" />
        <div className="mw-loading-ring-outer" />
        <span className="mw-loading-emoji" aria-hidden>
          🌱
        </span>
      </div>
      <p className="mw-loading-title">Growing your living memory ecosystem…</p>
      <p className="mw-loading-sub">Connecting roots, foliage, and moments</p>
    </div>
  );
}
