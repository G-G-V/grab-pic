import { StatsCard } from "@/components/StatsCard";
import { EventCard } from "@/components/EventCard";
import { mockEvents, mockEventStats } from "@/data/mock";
import { Images, Users, Search, Camera, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function OrganizerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's an overview of your account.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Photos"
          value={mockEventStats.totalPhotos}
          icon={Images}
          trend="+12% this week"
        />
        <StatsCard
          title="Faces Detected"
          value={mockEventStats.totalFacesDetected}
          icon={Users}
          trend="+8% this week"
        />
        <StatsCard
          title="Search Queries"
          value={mockEventStats.searchCount}
          icon={Search}
          trend="+24% this week"
        />
        <StatsCard
          title="Active Events"
          value={mockEvents.length}
          icon={Camera}
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold font-display">Recent Events</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
          <Link to="/organizer/events">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockEvents.slice(0, 3).map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onOpen={(id) => navigate(`/organizer/events/${id}`)}
            onDelete={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
