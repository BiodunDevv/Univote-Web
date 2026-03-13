import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StudentImagePreview } from "./types";

type StudentImagePreviewDialogProps = {
  previewImage: StudentImagePreview | null;
  onClose: () => void;
};

export function StudentImagePreviewDialog({
  previewImage,
  onClose,
}: StudentImagePreviewDialogProps) {
  return (
    <Dialog
      open={Boolean(previewImage)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="h-[92vh] max-w-[95vw] overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="text-sm font-semibold">
            {previewImage?.fullName || "Profile Image"}
            {previewImage?.matricNo ? ` (${previewImage.matricNo})` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="flex h-full items-center justify-center bg-black p-3">
          {previewImage?.url ? (
            <img
              src={previewImage.url}
              alt={previewImage.fullName}
              className="max-h-full max-w-full object-contain"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
