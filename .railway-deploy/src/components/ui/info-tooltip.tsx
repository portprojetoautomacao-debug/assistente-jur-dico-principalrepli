import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  ariaLabel?: string;
}

export function InfoTooltip({
  content,
  side = "top",
  className = "",
  ariaLabel = "Mais informações",
}: Readonly<InfoTooltipProps>) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center p-0.5 rounded-full hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${className}`}
            aria-label={ariaLabel}
          >
            <Info size={16} className="text-muted-foreground cursor-help" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface LabelWithTooltipProps {
  label: string;
  tooltip: string;
  required?: boolean;
}

export function LabelWithTooltip({
  label,
  tooltip,
  required = false,
}: Readonly<LabelWithTooltipProps>) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </span>
      <InfoTooltip content={tooltip} />
    </div>
  );
}
