import {
  LayoutDashboard,
  Calendar,
  // Upload,
  BarChart3,
  Settings,
  Camera,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { title: "Dashboard", url: "/organizer", icon: LayoutDashboard },
  { title: "My Events", url: "/organizer/events", icon: Calendar },
  // { title: "Upload Photos", url: "/organizer/upload", icon: Upload },
  { title: "Analytics", url: "/organizer/analytics", icon: BarChart3 },
  { title: "Settings", url: "/organizer/settings", icon: Settings },
];

export function SidebarNavigation() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/30">
      <SidebarHeader className="p-4 pb-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="rounded-xl gradient-primary p-1.5 shadow-lg shadow-primary/20">
            <Camera className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold font-display gradient-text">
              GrabPic
            </span>
          )}
        </Link>
      </SidebarHeader>

      <Separator className="mx-4 w-auto opacity-30" />

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.url === "/organizer"
                    ? location.pathname === "/organizer"
                    : location.pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/organizer"}
                        className="rounded-xl transition-all duration-200 hover:bg-muted/50"
                        activeClassName="bg-primary/10 text-primary font-medium shadow-sm"
                      >
                        <item.icon className="mr-2.5 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="rounded-xl bg-card/80 border border-border/30 p-3 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                J
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate"></p>
                <p className="text-xs text-muted-foreground">Organizer</p>
              </div>
            </div>
            <Link
              to="/login"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Link>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
