import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AnalysisSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Grade card skeleton */}
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row">
        <Skeleton className="size-20 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-full max-w-md" />
        </div>
      </div>

      {/* Section skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}

      <p className="text-center text-sm text-muted-foreground">
        Analyzing policy... This usually takes 10–20 seconds.
      </p>
    </div>
  );
}
