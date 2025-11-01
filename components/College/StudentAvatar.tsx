import { CheckCircle2 } from "lucide-react";

interface StudentAvatarProps {
  photoUrl?: string;
  fullName: string;
  hasFacialData?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-9 w-9 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

const badgeSizes = {
  sm: { container: "h-3 w-3", icon: "w-2.5 h-2.5", text: "text-[7px]" },
  md: { container: "h-3.5 w-3.5", icon: "w-3 h-3", text: "text-[8px]" },
  lg: { container: "h-5 w-5", icon: "w-4 h-4", text: "text-[10px]" },
  xl: { container: "h-8 w-8", icon: "w-5 h-5", text: "text-xs" },
};

export function StudentAvatar({
  photoUrl,
  fullName,
  hasFacialData = false,
  size = "md",
  className = "",
}: StudentAvatarProps) {
  const getInitials = () => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-muted border-2 border-border`}
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={fullName}
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-semibold ${sizeClasses[
                  size
                ]
                  .split(" ")
                  .pop()}">${getInitials()}</div>`;
              }
            }}
          />
        ) : (
          <div
            className={`h-full w-full flex items-center justify-center bg-primary/10 text-primary font-semibold ${sizeClasses[
              size
            ]
              .split(" ")
              .pop()}`}
          >
            {getInitials()}
          </div>
        )}
      </div>
      {hasFacialData && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 ${badgeSizes[size].container} rounded-full bg-green-500 border-2 border-background flex items-center justify-center`}
        >
          {size === "sm" || size === "md" ? (
            <span className={`${badgeSizes[size].text} text-white`}>✓</span>
          ) : (
            <CheckCircle2 className={`${badgeSizes[size].icon} text-white`} />
          )}
        </div>
      )}
    </div>
  );
}
