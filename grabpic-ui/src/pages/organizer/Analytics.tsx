import { useEffect, useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { getEvents } from "@/api/events";
import { getEventStats, type EventStats } from "@/api/stats";
import { Images, Users, Search, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function Analytics() {
  const [stats, setStats] = useState<EventStats>({
    totalPhotos: 0,
    totalFacesDetected: 0,
    uniqueFaces: 0,
    searchCount: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const events = await getEvents();

      const eventStats = await Promise.all(
        events.map((event) => getEventStats(event.id)),
      );

      setStats(
        eventStats.reduce(
          (total, current) => ({
            totalPhotos: total.totalPhotos + current.totalPhotos,
            totalFacesDetected:
              total.totalFacesDetected + current.totalFacesDetected,
            uniqueFaces: total.uniqueFaces + current.uniqueFaces,
            searchCount: total.searchCount + current.searchCount,
          }),
          {
            totalPhotos: 0,
            totalFacesDetected: 0,
            uniqueFaces: 0,
            searchCount: 0,
          },
        ),
      );
    } catch (error) {
      console.error(error);

      toast({
        title: "Failed to load analytics",
        description:
          error instanceof Error ? error.message : "Unable to load analytics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Insights across all your events
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Photos"
          value={stats.totalPhotos}
          icon={Images}
        />

        <StatsCard
          title="Faces Detected"
          value={stats.totalFacesDetected}
          icon={Users}
        />

        <StatsCard
          title="Unique Faces"
          value={stats.uniqueFaces}
          icon={TrendingUp}
        />

        <StatsCard title="Searches" value={stats.searchCount} icon={Search} />
      </div>

      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle className="font-display text-base">
            Analytics Overview
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            These metrics represent the current aggregate statistics across all
            your events. Historical daily analytics are not currently available
            from the backend.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
