
'use client';

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { LogOut, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FirebaseClientProvider, useFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

function AppLayoutContent({ children }: { children: ReactNode }) {
  const { auth, user, isUserLoading } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

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


  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const isMyDashboard = pathname === '/my-dashboard';

  return (
    <SidebarProvider>
      {!isMyDashboard && (
        <Sidebar>
          <SidebarHeader className="p-2">
            <div className="flex items-center gap-2.5 px-2">
                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-7 w-7 text-primary"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10a9.96 9.96 0 006.33-2.134c-1.393-.56-2.505-1.553-3.08-2.735a7.485 7.485 0 01-6.497-6.497C7.553 9.04 6.56 7.928 6 6.535A9.96 9.96 0 002 12zm10 2.236a9.993 9.993 0 00-11.833 9.61c.143.91.455 1.766.91 2.531 1.488-1.076 2.51-2.748 2.82-4.592A5.5 5.5 0 0017.5 8.075c1.844.31 3.516 1.332 4.592 2.82.765-.455 1.62-.767 2.531-.91A9.993 9.993 0 0012 4.236z"
                      clipRule="evenodd"
                    />
                  </svg>
              <h1 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">TimeSense HR</h1>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-2">
              <Button onClick={handleSignOut} variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" tooltip={{children: 'Se Déconnecter', side: 'right', align: 'center'}}>
                  
                      <LogOut className="mr-2 h-5 w-5 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">Se Déconnecter</span>
                  
              </Button>
          </SidebarFooter>
        </Sidebar>
      )}
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
