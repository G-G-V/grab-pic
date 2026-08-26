import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/components/UploadDropzone";
import { ArrowLeft, Images, Users, CheckCircle2, Search } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getEvents, type Event } from "@/api/events";
import { getPresignedUrls, uploadToS3, confirmUpload } from "@/api/photos";
import { getEventStats, type EventStats } from "@/api/stats";

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();

  const [tab, setTab] = useState("upload");
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    if (!eventId) return;

    try {
      setLoading(true);

      const [events, eventStats] = await Promise.all([
        getEvents(),
        getEventStats(eventId),
      ]);

      const foundEvent = events.find((item) => item.id === eventId);

      if (!foundEvent) {
        throw new Error("Event not found.");
      }

      setEvent(foundEvent);
      setStats(eventStats);
    } catch (error) {
      console.error(error);

      toast({
        title: "Failed to load event",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  const handleFiles = async (files: File[]) => {
    if (!eventId || files.length === 0) return;

    try {
      setUploading(true);

      // 1. Get presigned S3 PUT URLs.
      const presigned = await getPresignedUrls(
        eventId,
        files.map((file) => file.name),
      );

      // 2. Upload actual browser File objects directly to S3.
      await Promise.all(
        presigned.map(async (item) => {
          const file = files.find(
            (candidate) => candidate.name === item.filename,
          );

          if (!file) {
            throw new Error(`Selected file not found: ${item.filename}`);
          }

          await uploadToS3(item.uploadUrl, file);
        }),
      );

      // 3. Confirm only after all S3 uploads succeeded.
      await confirmUpload(
        eventId,
        presigned.map((item) => item.photoId),
      );

      toast({
        title: "Upload successful",
        description: `${files.length} photo${
          files.length === 1 ? "" : "s"
        } queued for processing.`,
      });

      // Refresh stats so the photo count updates.
      const updatedStats = await getEventStats(eventId);
      setStats(updatedStats);
    } catch (error) {
      console.error(error);

      toast({
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong during upload.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading event...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground -ml-2"
            asChild
          >
            <Link to="/organizer/events">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Events
            </Link>
          </Button>

          <h1 className="text-3xl font-bold font-display">{event.name}</h1>

          <p className="text-sm text-muted-foreground">
            Manage your event photos and processing.
          </p>
        </div>
      </div>

      {/* Real statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl px-4 py-4 text-center">
          <Images className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold font-display">
            {stats?.totalPhotos ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Photos</p>
        </div>

        <div className="glass rounded-xl px-4 py-4 text-center">
          <CheckCircle2 className="h-4 w-4 text-success mx-auto mb-1" />
          <p className="text-lg font-bold font-display">
            {stats?.totalFacesDetected ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Faces Detected</p>
        </div>

        <div className="glass rounded-xl px-4 py-4 text-center">
          <Users className="h-4 w-4 text-secondary mx-auto mb-1" />
          <p className="text-lg font-bold font-display">
            {stats?.uniqueFaces ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Unique Faces</p>
        </div>

        <div className="glass rounded-xl px-4 py-4 text-center">
          <Search className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold font-display">
            {stats?.searchCount ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Searches</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-card/60 border border-border/40">
          <TabsTrigger value="upload">Upload</TabsTrigger>

          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          {uploading && (
            <div className="mb-4 text-sm text-muted-foreground">
              Uploading photos and starting processing...
            </div>
          )}

          <UploadDropzone
            onFilesSelected={handleFiles}
            showPreviews
            className="min-h-[200px]"
          />
        </TabsContent>

        <TabsContent value="gallery" className="mt-6">
          <div className="glass rounded-2xl p-12 text-center">
            <Images className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />

            <p className="font-medium">
              Organizer gallery is not available through the current API.
            </p>

            <p className="text-sm text-muted-foreground mt-2">
              Photos are stored and processed in the background. Attendees
              retrieve matching photos through the search flow.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
