import { LogoIcon } from "@/components/logo";
import { cn } from "@/lib/utils";

export function AuthBrandMark({ className }: { className?: string }) {
  return (
    <LogoIcon
      className={cn(
        "h-8 w-8 text-foreground",
        className,
      )}
    />
  );
}
