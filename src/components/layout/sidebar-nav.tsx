"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LayoutDashboard, Wrench, Upload, FileSpreadsheet, CalendarDays } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/corrections", label: "Corrections", icon: Wrench },
  { href: "/import", label: "Import Logs", icon: Upload },
  { href: "/payroll", label: "Payroll", icon: FileSpreadsheet },
  { href: "/planning", label: "Planning", icon: CalendarDays },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith(item.href)}
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
    </SidebarMenu>
  );
}
