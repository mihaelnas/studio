
'use client';

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/header";
import { AdminSidebarNav } from "@/components/layout/admin-sidebar-nav";
import { EmployeeSidebarNav } from "@/components/layout/employee-sidebar-nav";
import { LogOut, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FirebaseClientProvider, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where } from 'firebase/firestore';
import type { Employee } from "@/lib/types";

function AppLayoutContent({ children }: { children: ReactNode }) {
  const { auth, user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const employeeQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'employees'), where('authUid', '==', user.uid));
  }, [firestore, user]);

  const { data: employeeData, isLoading: isEmployeeLoading } = useCollection<Employee>(employeeQuery);
  const employee = employeeData?.[0];

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);
  
  const handleSignOut = async () => {
    if (!auth) return;
    try {
        await signOut(auth);
        toast({
            title: "Déconnexion réussie",
            description: "Vous avez été déconnecté.",
        });
        router.push('/login');
    } catch (error) {
        console.error("Error signing out: ", error);
        toast({
            variant: "destructive",
            title: "Erreur de déconnexion",
            description: "Une erreur est survenue lors de la déconnexion.",
        });
    }
  };


  if (isUserLoading || isEmployeeLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-2">
            <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 shrink-0"
                >
                    <path
                        d="M50 25C50 22.2386 52.2386 20 55 20H75C77.7614 20 80 22.2386 80 25V39C80 40.6569 78.6569 42 77 42H50V25Z"
                        className="fill-primary"
                    ></path>
                    <path
                        d="M32 60.5C32 55.8056 35.8056 52 40.5 52H50V78C50 80.7614 47.7614 83 45 83H36C33.7909 83 32 81.2091 32 79V60.5Z"
                        className="fill-primary opacity-70"
                    ></path>
                    <path
                        d="M50 52H59.5C64.1944 52 68 55.8056 68 60.5V79C68 81.2091 66.2091 83 64 83H50V52Z"
                        className="fill-primary"
                    ></path>
                </svg>
              <h1 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">TimeSense HR</h1>
            </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          {employee?.role === 'admin' ? <AdminSidebarNav /> : <EmployeeSidebarNav />}
        </SidebarContent>
        <SidebarFooter className="p-2">
            <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" tooltip={{children: 'Se Déconnecter', side: 'right', align: 'center'}}>
                
                    <LogOut className="mr-2 h-5 w-5 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden">Se Déconnecter</span>
                
            </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-screen-2xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </FirebaseClientProvider>
  );
}
