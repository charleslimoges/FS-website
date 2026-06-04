export function BuildingSkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-card">
      <div className="skeleton h-52 w-full" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-4 w-1/3 rounded-lg" />
        <div className="skeleton h-5 w-2/3 rounded-lg" />
        <div className="skeleton h-4 w-1/2 rounded-lg" />
        <div className="flex gap-2 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-7 w-16 rounded-lg" />
          ))}
        </div>
        <div className="skeleton h-10 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}

export function UnitSkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-card">
      <div className="skeleton h-44 w-full" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-4 w-1/4 rounded-lg" />
        <div className="skeleton h-5 w-1/2 rounded-lg" />
        <div className="flex gap-4 mt-1">
          <div className="skeleton h-4 w-16 rounded-lg" />
          <div className="skeleton h-4 w-16 rounded-lg" />
          <div className="skeleton h-4 w-16 rounded-lg" />
        </div>
        <div className="skeleton h-10 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}
