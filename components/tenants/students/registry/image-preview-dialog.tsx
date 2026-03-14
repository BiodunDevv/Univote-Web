import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
    <Sheet
      open={Boolean(previewImage)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-full p-0 sm:max-w-2xl">
        <SheetHeader className="border-b p-3 text-left">
          <SheetTitle className="text-sm font-semibold">
            {previewImage?.fullName || "Profile Image"}
            {previewImage?.identifier ? ` (${previewImage.identifier})` : ""}
          </SheetTitle>
        </SheetHeader>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-black p-3">
          {previewImage?.url ? (
            <img
              src={previewImage.url}
              alt={previewImage.fullName}
              className="max-h-full max-w-full object-contain"
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
