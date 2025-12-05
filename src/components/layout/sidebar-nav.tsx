
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LayoutDashboard, Wrench, Upload, FileSpreadsheet, CalendarDays, History, BarChart, Cog, Users, UserSquare } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tableau de Bord RH", icon: LayoutDashboard },
  { href: "/employees", label: "Employés", icon: Users },
  { href: "/planning", label: "Planning Tâches", icon: CalendarDays },
  { href: "/corrections", label: "Corrections", icon: Wrench },
  { href: "/payroll", label: "Paie", icon: FileSpreadsheet },
  { href: "/import", label: "Importer Logs", icon: Upload },
  { href: "/logs", label: "Logs Bruts", icon: History },
  { href: "/processing", label: "Traitement", icon: Cog },
  { href: "/analyses", label: "Analyses", icon: BarChart },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href + item.label}>
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
