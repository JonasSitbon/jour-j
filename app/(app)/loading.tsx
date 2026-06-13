export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-pulse max-w-3xl mx-auto w-full">
      {/* Page head skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-48 rounded-lg bg-surface-3" />
          <div className="h-4 w-72 rounded-lg bg-surface-3" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-surface-3" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-3 gap-px bg-line border border-line rounded-card overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-surface px-5 py-4 flex flex-col gap-2">
            <div className="h-7 w-16 rounded bg-surface-3" />
            <div className="h-3 w-24 rounded bg-surface-3" />
          </div>
        ))}
      </div>

      {/* Cards skeleton */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-card border border-line bg-surface p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-3" />
              <div className="flex flex-col gap-1.5">
                <div className="h-4 w-40 rounded bg-surface-3" />
                <div className="h-3 w-24 rounded bg-surface-3" />
              </div>
            </div>
            <div className="h-6 w-16 rounded-full bg-surface-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
