export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-9 w-32 bg-muted animate-pulse rounded" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between p-4 border-b last:border-0">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}