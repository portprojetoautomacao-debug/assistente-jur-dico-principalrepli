import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DJENLoadingCardProps {
  readonly compact?: boolean;
}

export function DJENLoadingCard({ compact = false }: Readonly<DJENLoadingCardProps>) {
  return (
    <Card className={cn("card-glow-hover glassmorphic", compact && "h-fit")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
