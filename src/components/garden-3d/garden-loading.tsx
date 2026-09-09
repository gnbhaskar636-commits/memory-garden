export function GardenLoading() {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 bg-primary/10">
      <p className="text-3xl" aria-hidden>
        🌱
      </p>
      <p className="font-hand text-xl text-muted">Growing your garden…</p>
    </div>
  );
}
