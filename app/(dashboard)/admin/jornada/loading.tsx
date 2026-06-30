export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-4 w-56 bg-muted animate-pulse rounded" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-44 bg-muted animate-pulse rounded" />
        <div className="h-9 w-48 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-2">
            <div className="h-4 w-28 bg-muted animate-pulse rounded" />
            <div className="h-8 w-12 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
      <div className="border rounded-lg overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b last:border-0">
            <div className="h-4 w-36 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}