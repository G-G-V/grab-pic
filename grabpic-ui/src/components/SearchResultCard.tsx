import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchMatch } from "@/api/search";

// interface SearchResultCardProps {
//   match: SearchMatch;
//   className?: string;
// }

interface SearchResultCardProps {
  match: SearchMatch;
  onDownload: () => void;
  className?: string;
}

// export function SearchResultCard({ match, className }: SearchResultCardProps) {
export function SearchResultCard({
  match,
  onDownload,
  className,
}: SearchResultCardProps) {
  const scorePercent = Math.round(match.similarityScore * 100);

  // // const handleDownload = async () => {
  // //   try {
  // //     const response = await fetch(match.url);

  // //     if (!response.ok) {
  // //       throw new Error("Failed to download image.");
  // //     }

  // //     const blob = await response.blob();
  // //     const blobUrl = URL.createObjectURL(blob);

  // //     const anchor = document.createElement("a");
  // //     anchor.href = blobUrl;
  // //     anchor.download = `${match.photoId}.jpg`;

  // //     document.body.appendChild(anchor);
  // //     anchor.click();
  // //     anchor.remove();

  // //     URL.revokeObjectURL(blobUrl);
  // //   } catch (error) {
  // //     console.error("Download failed:", error);
  // //   }
  // // };

  // // const handleDownload = () => {
  // //   const link = document.createElement("a");
  // //   link.href = match.url;
  // //   link.download = `${match.photoId}.jpg`;
  // //   document.body.appendChild(link);
  // //   link.click();
  // //   document.body.removeChild(link);
  // // };

  // // const handleDownload = () => {
  // //   const a = document.createElement("a");
  // //   a.href = match.url;
  // //   a.target = "_blank";
  // //   a.rel = "noopener noreferrer";
  // //   a.download = `${match.photoId}.jpg`;

  // //   document.body.appendChild(a);
  // //   a.click();
  // //   document.body.removeChild(a);
  // // };

  // // const handleDownload = async (url, filename = "photo.jpg") => {
  // //   const response = await fetch(url);
  // //   const blob = await response.blob();
  // //   const blobUrl = URL.createObjectURL(blob);
  // //   const a = document.createElement("a");
  // //   a.href = blobUrl;
  // //   a.download = filename;
  // //   a.click();
  // //   URL.revokeObjectURL(blobUrl);
  // // };

  // // const handleDownload = async (url: string, filename = "photo.jpg") => {
  // //   try {
  // //     const response = await fetch(url);

  // //     if (!response.ok) {
  // //       throw new Error("Failed to download image.");
  // //     }

  // //     const blob = await response.blob();
  // //     const blobUrl = URL.createObjectURL(blob);

  // //     const a = document.createElement("a");
  // //     a.href = blobUrl;
  // //     a.download = filename;

  // //     document.body.appendChild(a);
  // //     a.click();
  // //     document.body.removeChild(a);

  // //     URL.revokeObjectURL(blobUrl);
  // //   } catch (error) {
  // //     console.error("Download failed:", error);
  // //   }
  // // };

  // const handleDownload = async () => {
  //   console.log("=== DOWNLOAD HANDLER HIT ===");
  //   console.log("URL:", match.url);

  //   try {
  //     const response = await fetch(match.url);

  //     console.log("DOWNLOAD STATUS:", response.status);
  //     console.log("CONTENT TYPE:", response.headers.get("content-type"));
  //     console.log("CONTENT LENGTH:", response.headers.get("content-length"));

  //     const blob = await response.blob();

  //     console.log("BLOB TYPE:", blob.type);
  //     console.log("BLOB SIZE:", blob.size);

  //     const blobUrl = URL.createObjectURL(blob);

  //     const anchor = document.createElement("a");
  //     anchor.href = blobUrl;
  //     anchor.download = `${match.photoId}.jpg`;

  //     document.body.appendChild(anchor);
  //     anchor.click();
  //     document.body.removeChild(anchor);

  //     URL.revokeObjectURL(blobUrl);
  //   } catch (error) {
  //     console.error("DOWNLOAD ERROR:", error);
  //   }
  // };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl glass transition-all duration-300 hover:border-primary/30 break-inside-avoid",
        className,
      )}
    >
      <div className="overflow-hidden">
        <img
          src={match.url}
          alt="Matched photo"
          className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4 gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 text-xs backdrop-blur-sm"
          onClick={() => window.open(match.url, "_blank")}
        >
          <Eye className="mr-1 h-3 w-3" />
          View
        </Button>

        <Button
          size="sm"
          className="h-8 text-xs gradient-primary border-0"
          // onClick={handleDownload}
          onClick={onDownload}
        >
          <Download className="mr-1 h-3 w-3" />
          Download
        </Button>
      </div>

      <Badge
        className={cn(
          "absolute right-2 top-2 border font-mono text-xs",
          scorePercent >= 85
            ? "bg-success/15 text-success border-success/25"
            : scorePercent >= 70
              ? "bg-secondary/15 text-secondary border-secondary/25"
              : "bg-accent/15 text-accent border-accent/25",
        )}
      >
        {scorePercent}%
      </Badge>
    </div>
  );
}
