import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, Globe, Newspaper, RefreshCw } from "lucide-react";

interface DJENErrorCardProps {
  readonly compact?: boolean;
  readonly error?: string;
  readonly isGeoBlocked?: boolean;
  readonly onRetry: () => void;
}

export function DJENErrorCard({
  compact = false,
  error,
  isGeoBlocked = false,
  onRetry,
}: Readonly<DJENErrorCardProps>) {
  return (
    <Card className={cn("card-glow-hover glassmorphic", compact && "h-fit")}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Newspaper size={20} className="text-primary" />
          Publicações DJEN
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isGeoBlocked ? (
          <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <Globe size={16} className="text-amber-500" />
            <AlertTitle className="text-amber-700 dark:text-amber-400">
              Restrição Geográfica
            </AlertTitle>
            <AlertDescription className="text-amber-600 dark:text-amber-300">
              A API do DJEN só aceita requisições do Brasil.
              <br />
              <span className="text-xs">Verifique sua conexão ou utilize uma VPN brasileira.</span>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertTriangle size={16} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-3 w-full">
          <RefreshCw size={16} />
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );
}
