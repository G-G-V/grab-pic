import { useEffect, useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { EventCard } from "@/components/EventCard";
import { getEvents, deleteEvent, type Event } from "@/api/events";
import { getEventStats, type EventStats } from "@/api/stats";
import { Images, Users, Search, Camera, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function OrganizerDashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<EventStats>({
    totalPhotos: 0,
    totalFacesDetected: 0,
    searchCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const loadedEvents = await getEvents();
      setEvents(loadedEvents);

      const eventStats = await Promise.all(
        loadedEvents.map((event) => getEventStats(event.id)),
      );

      setStats(
        eventStats.reduce(
          (total, current) => ({
            totalPhotos: total.totalPhotos + current.totalPhotos,
            totalFacesDetected:
              total.totalFacesDetected + current.totalFacesDetected,
            searchCount: total.searchCount + current.searchCount,
          }),
          {
            totalPhotos: 0,
            totalFacesDetected: 0,
            searchCount: 0,
          },
        ),
      );
    } catch (error) {
      console.error(error);

      toast({
        title: "Failed to load dashboard",
        description:
          error instanceof Error
            ? error.message
            : "Unable to load your dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId);

      setEvents((current) => current.filter((event) => event.id !== eventId));

      await loadDashboard();

      toast({
        title: "Event deleted",
        description: "The event and its photos were deleted.",
      });
    } catch (error) {
      console.error(error);

      toast({
        title: "Failed to delete event",
        description:
          error instanceof Error
            ? error.message
            : "Unable to delete the event.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back. Here's an overview of your account.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* <StatsCard
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
          title="Search Queries"
          value={stats.searchCount}
          icon={Search}
        />

        <StatsCard title="Active Events" value={events.length} icon={Camera} /> */}

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
          title="Search Queries"
          value={stats.searchCount}
          icon={Search}
        />

        <StatsCard title="Active Events" value={events.length} icon={Camera} />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold font-display">Recent Events</h2>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link to="/organizer/events">
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {events.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.slice(0, 3).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onOpen={(id) => navigate(`/organizer/events/${id}`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/40 p-8 text-center">
          <p className="text-muted-foreground">No events yet.</p>
          <Button
            className="mt-4 gradient-primary border-0"
            onClick={() => navigate("/organizer/events")}
          >
            Create an Event
          </Button>
        </div>
      )}
    </div>
  );
}
