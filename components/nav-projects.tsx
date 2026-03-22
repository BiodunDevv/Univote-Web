"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavProjects({
  projects,
  label = "Projects",
}: {
  projects: {
    name: string;
    url: string;
    icon: LucideIcon;
    badge?: string | number | null;
  }[];
  label?: string;
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link href={item.url}>
                <item.icon />
                <span>{item.name}</span>
                {item.badge ? (
                  <Badge
                    variant="default"
                    className="ml-auto h-5 min-w-5 rounded-full px-1.5 text-[10px] font-semibold"
                  >
                    {item.badge}
                  </Badge>
                ) : null}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
