import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNavigation } from "@/components/SidebarNavigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OrganizerLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarNavigation />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/30 px-4 bg-background/60 backdrop-blur-xl sticky top-0 z-30">
            <SidebarTrigger className="mr-4" />
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-secondary" />
              </Button>
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                J
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
