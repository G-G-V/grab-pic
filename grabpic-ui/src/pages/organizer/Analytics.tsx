import { StatsCard } from "@/components/StatsCard";
import { mockEventStats } from "@/data/mock";
import { Images, Users, Search, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

function BarChart({ data, color, labels }: { data: number[]; color: string; labels: string[] }) {
  const max = Math.max(...data);
  return (
    <div>
      <div className="flex items-end gap-2 h-40">
        {data.map((v, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
            className="flex-1 rounded-t-lg transition-all hover:opacity-80 cursor-pointer relative group"
            style={{ background: color }}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block text-xs font-medium bg-card border border-border/40 rounded-md px-2 py-1 whitespace-nowrap">
              {v}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex justify-between mt-3 text-xs text-muted-foreground">
        {labels.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </div>
  );
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Analytics() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">Analytics</h1>
        <p className="text-muted-foreground mt-1">Insights across all your events</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Photos" value={mockEventStats.totalPhotos} icon={Images} trend="+12%" />
        <StatsCard title="Faces Detected" value={mockEventStats.totalFacesDetected} icon={Users} trend="+8%" />
        <StatsCard title="Unique Faces" value={mockEventStats.uniqueFaces} icon={TrendingUp} trend="+5%" />
        <StatsCard title="Searches" value={mockEventStats.searchCount} icon={Search} trend="+24%" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Photos Uploaded</CardTitle>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardHeader>
          <CardContent>
            <BarChart
              data={[120, 340, 280, 520, 410, 680, 590]}
              color="hsl(239 84% 67%)"
              labels={days}
            />
          </CardContent>
        </Card>

        <Card className="glass border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base">Search Queries</CardTitle>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardHeader>
          <CardContent>
            <BarChart
              data={[80, 200, 150, 380, 290, 450, 520]}
              color="hsl(188 94% 53%)"
              labels={days}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
