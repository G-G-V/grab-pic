import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Upload, ImagePlus, CheckCircle2, FileImage } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UploadFile {
  file: File;
  preview?: string;
  progress: number;
  done: boolean;
}

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  className?: string;
  accept?: string;
  multiple?: boolean;
  label?: string;
  showPreviews?: boolean;
}

export function UploadDropzone({
  onFilesSelected,
  className,
  accept = "image/*",
  multiple = true,
  label = "Drag & drop photos here, or click to browse",
  showPreviews = false,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadFile[]>([]);

  const simulateUpload = (files: File[]) => {
    const newUploads = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      done: false,
    }));
    setUploads((prev) => [...prev, ...newUploads]);

    // Simulate progress
    newUploads.forEach((upload, idx) => {
      const interval = setInterval(() => {
        setUploads((prev) =>
          prev.map((u) => {
            if (u.file === upload.file && !u.done) {
              const next = Math.min(u.progress + Math.random() * 25, 100);
              return { ...u, progress: next, done: next >= 100 };
            }
            return u;
          })
        );
      }, 300 + idx * 100);

      setTimeout(() => clearInterval(interval), 3000);
    });
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      onFilesSelected(files);
      if (showPreviews) simulateUpload(files);
    },
    [onFilesSelected, showPreviews]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      if (showPreviews) simulateUpload(files);
    }
  };

  return (
    <div className="space-y-4">
      <label
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all duration-300",
          isDragging
            ? "border-primary bg-primary/5 glow"
            : "border-border/60 hover:border-primary/40 hover:bg-card/40",
          className
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className={cn(
          "rounded-2xl p-4 mb-4 transition-all",
          isDragging ? "bg-primary/15 scale-110" : "bg-primary/10"
        )}>
          {isDragging ? (
            <Upload className="h-8 w-8 text-primary animate-bounce" />
          ) : (
            <ImagePlus className="h-8 w-8 text-primary" />
          )}
        </div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG up to 20MB each</p>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleChange}
        />
      </label>

      {/* Upload previews with progress */}
      {showPreviews && uploads.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {uploads.map((u, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <div className="aspect-square relative">
                {u.preview ? (
                  <img src={u.preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-muted/20">
                    <FileImage className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                {!u.done && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <div className="w-3/4">
                      <Progress value={u.progress} className="h-1.5" />
                    </div>
                  </div>
                )}
                {u.done && (
                  <div className="absolute top-1.5 right-1.5">
                    <CheckCircle2 className="h-5 w-5 text-success drop-shadow-lg" />
                  </div>
                )}
              </div>
              <div className="px-2 py-1.5">
                <p className="text-xs text-muted-foreground truncate">{u.file.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
