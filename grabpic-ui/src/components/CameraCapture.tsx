import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel?: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [starting, setStarting] = useState(true);
  const [captured, setCaptured] = useState<string | null>(null);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setStarting(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera access failed:", error);

      toast({
        title: "Camera unavailable",
        description:
          "Please allow camera access or use the upload option instead.",
        variant: "destructive",
      });

      onCancel?.();
    } finally {
      setStarting(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const capture = () => {
    const video = videoRef.current;

    if (!video || video.readyState < 2) {
      toast({
        title: "Camera not ready",
        description: "Please wait for the camera preview to appear.",
        variant: "destructive",
      });
      return;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      toast({
        title: "Capture failed",
        description: "Could not capture the camera frame.",
        variant: "destructive",
      });
      return;
    }

    // Mirror the selfie horizontally to match the preview.
    context.translate(canvas.width, 0);
    context.scale(-1, 1);

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const previewUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCaptured(previewUrl);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast({
            title: "Capture failed",
            description: "Could not create the captured image.",
            variant: "destructive",
          });
          return;
        }

        const file = new File([blob], `selfie-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        stopCamera();
        onCapture(file);
      },
      "image/jpeg",
      0.9,
    );
  };

  const retake = async () => {
    setCaptured(null);
    await startCamera();
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-black aspect-video">
        {captured ? (
          <img
            src={captured}
            alt="Captured selfie"
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover scale-x-[-1]"
            />

            {starting && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <p className="text-sm text-muted-foreground">
                  Starting camera...
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {captured ? (
          <>
            <Button type="button" variant="outline" onClick={retake}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
          </>
        ) : (
          <Button
            type="button"
            className="gradient-primary border-0"
            onClick={capture}
            disabled={starting}
          >
            <Camera className="mr-2 h-4 w-4" />
            Capture Selfie
          </Button>
        )}

        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              stopCamera();
              onCancel();
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
