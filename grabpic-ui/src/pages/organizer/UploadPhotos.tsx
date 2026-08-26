import { UploadDropzone } from "@/components/UploadDropzone";
import { toast } from "@/hooks/use-toast";

export default function UploadPhotos() {
  const handleFiles = (selected: File[]) => {
    toast({ title: "Files added", description: `${selected.length} photos queued.` });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">Upload Photos</h1>
        <p className="text-muted-foreground mt-1">Select an event and upload your event photos</p>
      </div>

      <UploadDropzone
        onFilesSelected={handleFiles}
        showPreviews
        className="min-h-[250px]"
      />
    </div>
  );
}
