import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Photo } from "@/data/mock";

interface PhotoCardProps {
  photo: Photo;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  processed: { bg: "bg-success/15 border-success/25", text: "text-success" },
  pending: { bg: "bg-accent/15 border-accent/25", text: "text-accent" },
  failed: { bg: "bg-destructive/15 border-destructive/25", text: "text-destructive" },
};

export function PhotoCard({ photo, className }: PhotoCardProps) {
  const status = statusConfig[photo.processingStatus];

  return (
    <div className={cn("group relative overflow-hidden rounded-xl glass transition-all duration-300 hover:border-primary/30", className)}>
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={photo.url}
          alt="Event photo"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
      </div>

      {/* Hover overlay with actions */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4 gap-2">
        <Button size="sm" variant="secondary" className="h-8 text-xs backdrop-blur-sm">
          <Eye className="mr-1 h-3 w-3" /> Preview
        </Button>
        <Button size="sm" className="h-8 text-xs gradient-primary border-0">
          <Download className="mr-1 h-3 w-3" /> Save
        </Button>
      </div>

      <Badge
        className={cn(
          "absolute right-2 top-2 text-[10px] uppercase tracking-wider border",
          status.bg,
          status.text
        )}
      >
        {photo.processingStatus}
      </Badge>
    </div>
  );
}
