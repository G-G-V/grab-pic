import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  iconColor?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, className, iconColor }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "glass rounded-2xl p-6 transition-all duration-300 hover:border-primary/30 hover:glow-sm group",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold font-display tracking-tight">{typeof value === "number" ? value.toLocaleString() : value}</p>
        </div>
        <div className={cn(
          "rounded-xl p-2.5 transition-colors",
          iconColor || "bg-primary/10"
        )}>
          <Icon className={cn("h-5 w-5", iconColor ? "text-current" : "text-primary")} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            {trend}
          </span>
        </div>
      )}
    </motion.div>
  );
}
