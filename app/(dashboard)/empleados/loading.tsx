export default function Loading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="h-5 w-24 bg-muted animate-pulse rounded" />
        <div className="h-8 w-28 bg-muted animate-pulse rounded" />
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-7 w-28 bg-muted animate-pulse rounded" />
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 h-8 bg-muted-foreground/20 animate-pulse rounded" />
          ))}
        </div>

        {/* Card skeleton */}
        <div className="border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" />
          </div>
          <div className="h-12 w-full bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  )
}