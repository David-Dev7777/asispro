export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-36 bg-muted animate-pulse rounded" />
          <div className="h-4 w-44 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-9 w-36 bg-muted animate-pulse rounded" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b last:border-0">
            <div className="h-4 w-36 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-12 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}