// import { useState } from "react";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

import { useEffect, useState } from "react";
import { createEvent, deleteEvent, getEvents, type Event } from "@/api/events";

export default function MyEvents() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to load events",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const filtered = events.filter((event) =>
    event.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Event name required",
        description: "Please enter an event name.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      const result = await createEvent(name.trim(), desc.trim());

      toast({
        title: "Event Created!",
        description: `Join code: ${result.joinCode}`,
      });

      setOpen(false);
      setName("");
      setDesc("");

      await loadEvents();
    } catch (error) {
      console.error(error);

      toast({
        title: "Failed to create event",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">My Events</h1>
          <p className="text-muted-foreground mt-1">
            Manage your event photo collections
          </p>
        </div>
        <Button
          className="gradient-primary border-0"
          onClick={() => setOpen(true)}
        >
          Create Event
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card/60 border-border/40"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading events...
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onOpen={(id) => navigate(`/organizer/events/${id}`)}
              onDelete={async (id) => {
                try {
                  await deleteEvent(id);

                  setEvents((current) =>
                    current.filter((event) => event.id !== id),
                  );

                  toast({
                    title: "Event deleted",
                    description: "Event deleted successfully.",
                  });
                } catch (error) {
                  console.error(error);

                  toast({
                    title: "Failed to delete event",
                    description:
                      error instanceof Error
                        ? error.message
                        : "Something went wrong.",
                    variant: "destructive",
                  });
                }
              }}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No events found.</p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-strong border-border/40 glow-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Create New Event
            </DialogTitle>
            <DialogDescription>
              A unique join code will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tech Fest 2026"
                className="bg-muted/20"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Brief description..."
                className="bg-muted/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary border-0"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
