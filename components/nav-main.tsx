"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  label = "Platform",
  rootUrl = "/dashboard",
}: {
  label?: string;
  rootUrl?: string;
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    comingSoon?: boolean;
    items?: {
    title: string;
    url: string;
    comingSoon?: boolean;
    badge?: string | number | null;
  }[];
    badge?: string | number | null;
  }[];
}) {
  const pathname = usePathname();

  const isActive = (url: string) =>
    url === rootUrl ? pathname === rootUrl : pathname.startsWith(url);

  const isGroupActive = (item: { url: string; items?: { url: string }[] }) =>
    isActive(item.url) || (item.items?.some((s) => isActive(s.url)) ?? false);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const subItems = item.items ?? [];
          const shouldCollapse = subItems.length > 1;

          return shouldCollapse ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isGroupActive(item)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isGroupActive(item)}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.comingSoon && (
                      <Badge
                        variant="secondary"
                        className="ml-auto mr-1 h-4 px-1 text-[10px] font-medium"
                      >
                        Soon
                      </Badge>
                    )}
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {subItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive(subItem.url)}
                        >
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                            {subItem.comingSoon && (
                              <Badge
                                variant="secondary"
                                className="ml-auto h-4 px-1 text-[10px] font-medium"
                              >
                                Soon
                              </Badge>
                            )}
                            {subItem.badge ? (
                              <Badge
                                variant="default"
                                className="ml-auto h-5 min-w-5 rounded-full px-1.5 text-[10px] font-semibold"
                              >
                                {subItem.badge}
                              </Badge>
                            ) : null}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive(item.url)}
              >
                <Link href={item.items?.[0]?.url || item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {item.comingSoon && (
                    <Badge
                      variant="secondary"
                      className="ml-auto h-4 px-1 text-[10px] font-medium"
                    >
                      Soon
                    </Badge>
                  )}
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
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
