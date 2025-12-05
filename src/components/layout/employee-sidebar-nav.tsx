
'use client';

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { UserSquare } from "lucide-react";

const navGroups = [
  {
    title: "Mon Espace",
    items: [
      { href: "/my-dashboard", label: "Mon Tableau de Bord", icon: UserSquare },
    ]
  }
];

export function EmployeeSidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navGroups.map((group) => (
        <React.Fragment key={group.title}>
          {group.items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className="w-full justify-start"
                tooltip={{children: item.label, side: "right", align: "center"}}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </React.Fragment>
      ))}
    </SidebarMenu>
  );
}
