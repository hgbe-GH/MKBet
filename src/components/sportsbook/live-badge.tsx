export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[0.68rem] font-black tracking-[0.12em] text-white uppercase">
      <span
        aria-hidden="true"
        className="mk-status-dot h-2 w-2 rounded-full bg-white"
      />
      LIVE
    </span>
  );
}
