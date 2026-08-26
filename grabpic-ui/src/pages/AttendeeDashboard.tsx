import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UploadDropzone } from "@/components/UploadDropzone";
import { SearchResultCard } from "@/components/SearchResultCard";
import { getJoinedEvents, joinEvent, type JoinedEvent } from "@/api/events";
import { searchPhotos } from "@/api/search";
import {
  Camera,
  Search,
  Ticket,
  ImageIcon,
  ScanFace,
  Download,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

import { CameraCapture } from "@/components/CameraCapture";

export default function AttendeeDashboard() {
  const [events, setEvents] = useState<JoinedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<JoinedEvent | null>(null);

  const [loadingEvents, setLoadingEvents] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    loadJoinedEvents();
  }, []);

  const loadJoinedEvents = async () => {
    try {
      setLoadingEvents(true);

      const joinedEvents = await getJoinedEvents();
      setEvents(joinedEvents);

      if (joinedEvents.length > 0) {
        setSelectedEvent(joinedEvents[0]);
      }
    } catch (error) {
      console.error(error);

      toast({
        title: "Failed to load events",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;

    try {
      setJoining(true);

      await joinEvent(joinCode.trim());

      toast({
        title: "Event joined",
        description: "You can now search photos from this event.",
      });

      setJoinCode("");

      await loadJoinedEvents();
    } catch (error) {
      console.error(error);

      toast({
        title: "Unable to join event",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const handleSelfie = async (files: File[]) => {
    if (!selectedEvent || files.length === 0) return;

    try {
      setSearching(true);
      setResults(null);

      const file = files[0];

      // Convert selfie to base64.
      const base64 = await fileToBase64(file);

      const matches = await searchPhotos(selectedEvent.id, base64);

      setResults(matches);

      toast({
        title: "Search complete",
        description: `Found ${matches.length} matches.`,
      });
    } catch (error) {
      console.error(error);

      toast({
        title: "Search failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  // const handleDownloadAll = async () => {
  //   if (!results || results.length === 0) return;

  //   for (const match of results) {
  //     try {
  //       const response = await fetch(match.url);

  //       if (!response.ok) {
  //         console.error(`Failed to download ${match.photoId}`);
  //         continue;
  //       }

  //       const blob = await response.blob();
  //       const blobUrl = URL.createObjectURL(blob);

  //       const anchor = document.createElement("a");
  //       anchor.href = blobUrl;
  //       anchor.download = `photo-${match.photoId}.jpg`;

  //       document.body.appendChild(anchor);
  //       anchor.click();
  //       document.body.removeChild(anchor);

  //       URL.revokeObjectURL(blobUrl);

  //       // Give the browser a little time between downloads.
  //       await new Promise((resolve) => setTimeout(resolve, 500));
  //     } catch (error) {
  //       console.error(`Download failed for ${match.photoId}:`, error);
  //     }
  //   }
  // };

  // const handleDownloadAll = async () => {
  //   if (!results || results.length === 0) return;

  //   for (const match of results) {
  //     const a = document.createElement("a");
  //     a.href = match.url;
  //     a.download = `photo-${match.photoId}.jpg`;

  //     document.body.appendChild(a);
  //     a.click();
  //     a.remove();

  //     await new Promise((resolve) => setTimeout(resolve, 500));
  //   }
  // };

  const handleDownload = async () => {
    try {
      const response = await fetch(match.url);

      console.log("DOWNLOAD STATUS:", response.status);
      console.log("CONTENT TYPE:", response.headers.get("content-type"));
      console.log("CONTENT LENGTH:", response.headers.get("content-length"));

      const blob = await response.blob();

      console.log("BLOB TYPE:", blob.type);
      console.log("BLOB SIZE:", blob.size);

      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${match.photoId}.jpg`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleDownloadAll = async () => {
    if (!results || results.length === 0) return;

    for (const match of results) {
      try {
        const response = await fetch(match.url);

        if (!response.ok) {
          throw new Error(`Failed to download ${match.photoId}`);
        }

        const blob = await response.blob();

        console.log("DOWNLOAD STATUS:", response.status);
        console.log("CONTENT TYPE:", response.headers.get("content-type"));
        console.log("CONTENT LENGTH:", response.headers.get("content-length"));
        console.log("BLOB TYPE:", blob.type);
        console.log("BLOB SIZE:", blob.size);

        const blobUrl = URL.createObjectURL(blob);

        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = `photo-${match.photoId}.jpg`;

        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        URL.revokeObjectURL(blobUrl);

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Download failed for ${match.photoId}:`, error);
      }
    }
  };

  if (loadingEvents) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/20 bg-background/60 backdrop-blur-2xl sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="rounded-xl gradient-primary p-1.5 shadow-lg shadow-primary/20">
              <Camera className="h-5 w-5 text-primary-foreground" />
            </div>

            <span className="text-xl font-bold font-display gradient-text">
              GrabPic
            </span>
          </Link>

          <Button variant="ghost" className="text-muted-foreground" asChild>
            <Link to="/login">Sign out</Link>
          </Button>
        </div>
      </nav>

      <div className="container py-10 space-y-10 max-w-3xl">
        {/* Existing events */}
        <div>
          <h1 className="text-4xl font-bold font-display">Your Events</h1>

          <p className="text-muted-foreground mt-2">
            Select an event to find your photos.
          </p>
        </div>

        {events.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((event) => (
              <Card
                key={event.id}
                className={`glass border-border/40 cursor-pointer transition-all ${
                  selectedEvent?.id === event.id
                    ? "border-primary/60 glow-sm"
                    : "hover:border-primary/30"
                }`}
                onClick={() => {
                  setSelectedEvent(event);
                  setResults(null);
                }}
              >
                <CardHeader>
                  <CardTitle className="font-display">{event.name}</CardTitle>

                  <CardDescription>
                    Joined {new Date(event.joinedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Join another event */}
        <Card className="glass border-border/40 overflow-hidden">
          <div className="h-1 gradient-primary opacity-50" />

          <CardHeader className="text-center">
            <div className="mx-auto rounded-2xl bg-primary/10 p-4 w-fit mb-3">
              <Ticket className="h-8 w-8 text-primary" />
            </div>

            <CardTitle className="font-display text-2xl">
              Join Another Event
            </CardTitle>

            <CardDescription>
              Enter the join code provided by the organizer.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex gap-3 max-w-sm mx-auto">
              <Input
                placeholder="e.g. TF2026"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-muted/20 font-mono text-lg tracking-widest text-center h-12"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleJoin();
                  }
                }}
              />

              <Button
                className="gradient-primary border-0 px-8 h-12"
                onClick={handleJoin}
                disabled={joining}
              >
                {joining ? "Joining..." : "Join"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        {selectedEvent && (
          <Card className="glass border-border/40 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary opacity-50" />

            <CardHeader className="text-center pb-4">
              <div className="mx-auto rounded-2xl bg-secondary/10 p-4 w-fit mb-3">
                <ScanFace className="h-8 w-8 text-secondary" />
              </div>

              <CardTitle className="font-display text-2xl">
                Find Your Photos
              </CardTitle>

              <CardDescription>
                Searching in <strong>{selectedEvent.name}</strong>
              </CardDescription>
            </CardHeader>

            <CardContent>
              {cameraOpen ? (
                <CameraCapture
                  onCapture={(file) => {
                    setCameraOpen(false);
                    handleSelfie([file]);
                  }}
                  onCancel={() => setCameraOpen(false)}
                />
              ) : (
                <>
                  <UploadDropzone
                    onFilesSelected={handleSelfie}
                    multiple={false}
                    label="Upload a selfie to find your photos"
                    className="max-w-md mx-auto"
                  />

                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCameraOpen(true)}
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Use Camera
                    </Button>
                  </div>
                </>
              )}

              {searching && (
                <div className="text-center py-8">
                  <ScanFace className="mx-auto h-8 w-8 text-secondary animate-pulse" />
                  <p className="text-sm text-muted-foreground mt-3">
                    Searching event photos...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results !== null && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-display">
                {results.length > 0
                  ? `Found ${results.length} Photos`
                  : "No Matches"}
              </h2>

              {results.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                  <Download className="mr-1.5 h-4 w-4" />
                  Download All
                </Button>
              )}
            </div>

            {results.length > 0 ? (
              <div className="masonry-grid">
                {results.map((match: any) => (
                  <SearchResultCard key={match.photoId} match={match} />
                ))}
              </div>
            ) : (
              <Card className="glass border-border/40 p-12 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />

                <p className="text-muted-foreground text-lg">
                  No matches found
                </p>

                <p className="text-sm text-muted-foreground/60 mt-1">
                  Try a different selfie with better lighting.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Failed to encode image."));
        return;
      }

      // Keep only the base64 payload if FileReader returned a data URL.
      const base64 = result.includes(",") ? result.split(",")[1] : result;

      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read image."));
    };

    reader.readAsDataURL(file);
  });
}
