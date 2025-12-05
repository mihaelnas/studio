
'use client';

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, CalendarDays, Upload, History, Cog, BarChart, BrainCircuit, Wrench, FileSpreadsheet } from "lucide-react";

const adminNavGroups = [
  {
    title: "Gestion RH",
    items: [
      { href: "/dashboard", label: "Tableau de Bord RH", icon: LayoutDashboard },
      { href: "/employees", label: "Employés", icon: Users },
      { href: "/planning", label: "Planning Tâches", icon: CalendarDays },
    ],
  },
  {
    title: "Données & Traitement",
    items: [
       { href: "/import", label: "Importer Logs", icon: Upload },
       { href: "/logs", label: "Logs Bruts", icon: History },
       { href: "/processing", label: "Traitement", icon: Cog },
       { href: "/analyses", label: "Analyses", icon: BarChart },
    ]
  },
  {
    title: "Outils",
    items: [
        { href: "/ia", label: "Analyse IA", icon: BrainCircuit },
        { href: "/corrections", label: "Corrections", icon: Wrench },
        { href: "/payroll", label: "Paie", icon: FileSpreadsheet },
    ]
  }
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {adminNavGroups.map((group, groupIndex) => (
        <React.Fragment key={group.title}>
          {groupIndex > 0 && <SidebarSeparator className="my-2" />}
          {group.items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')}
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
