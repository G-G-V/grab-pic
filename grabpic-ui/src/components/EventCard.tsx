import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Images, Trash2, ArrowUpRight } from "lucide-react";
import { type Event } from "@/api/events";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface EventCardProps {
  event: Event;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void | Promise<void>;
}

export function EventCard({ event, onOpen, onDelete }: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/30 hover:glow-sm group"
    >
      {/* Accent bar */}
      <div className="h-1 gradient-primary opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold font-display truncate">
              {event.name}
            </h3>
          </div>

          <Badge
            variant="outline"
            className="border-primary/20 text-primary font-mono text-xs shrink-0"
          >
            Event
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Images className="h-3.5 w-3.5" />
            {event.photoCount.toLocaleString()}
          </span>

          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(event.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 gradient-primary text-primary-foreground border-0 h-9"
            onClick={() => onOpen(event.id)}
          >
            Open
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive h-9 w-9 p-0"
            onClick={() => onDelete(event.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
