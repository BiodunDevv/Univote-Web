"use client";

import { useRouter } from "next/navigation";
import { Mail, ShieldCheck, UserRound } from "lucide-react";
import { ChangingLoadingState } from "@/components/shared/changing-loading-state";
import { useStudentProfileQuery } from "@/lib/queries/student";
import { useStudentAuthStore } from "@/lib/store/useStudentAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentProfilePage() {
  const router = useRouter();
  const { logout } = useStudentAuthStore();
  const { data, isLoading, error } = useStudentProfileQuery();

  if (isLoading) {
    return (
      <ChangingLoadingState
        messages={[
          "Loading your profile...",
          "Checking account details...",
          "Preparing account actions...",
        ]}
      />
    );
  }

  if (!data || error) {
    return (
      <Card className="border shadow-none">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {(error as Error | undefined)?.message || "Profile is unavailable."}
        </CardContent>
      </Card>
    );
  }

  const initials = data.full_name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-5">
      <Card className="border shadow-none">
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarImage src={data.photo_url || undefined} alt={data.full_name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {data.full_name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {data.matric_no} • {data.department}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push("/students/profile/edit")}>
              Edit profile
            </Button>
            <Button variant="outline" onClick={() => router.push("/students/profile/password")}>
              Change password
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{data.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <span>
                {data.college} • Level {data.level}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span>
                {data.has_facial_data
                  ? "Face verification ready"
                  : "Face data not registered"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Keep your email and profile photo up to date so voting verification and alerts continue to work cleanly.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await logout();
                router.replace("/students/login");
              }}
            >
              Log out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
