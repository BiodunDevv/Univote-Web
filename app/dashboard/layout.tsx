import { AppSidebar } from "@/components/app-sidebar";
import { DashboardShellHeader } from "@/components/dashboard-shell-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardShellHeader />
          <div className="flex min-w-0 w-full max-w-full flex-1 flex-col overflow-x-hidden p-2">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
