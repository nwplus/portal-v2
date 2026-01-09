import { GoogleIcon } from "@/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useHackathon } from "@/hooks/use-hackathon";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useHackerStore } from "@/lib/stores/hacker-store";
import { getFullName, getSidebarHackathonIcon } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  ForkKnife,
  Home,
  Info,
  LogOut,
  Map as MapIcon,
  PackageOpen,
  Share2,
  Stamp,
  Ticket,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PropsWithChildren } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type MenuItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

const ACCOUNT_MENU_ITEMS: MenuItem[] = [
  {
    label: "My ticket",
    to: "/$activeHackathon/my-ticket",
    icon: Ticket,
  },
  {
    label: "Social profile",
    to: "/$activeHackathon/social-profile/$userId",
    icon: Share2,
  },
  {
    label: "Rewards",
    to: "/$activeHackathon/rewards",
    icon: Trophy,
  },
  {
    label: "Stamps",
    to: "/$activeHackathon/stampbook",
    icon: Stamp,
  },
];

const INFORMATION_MENU_ITEMS: MenuItem[] = [
  {
    label: "Hacker package",
    to: "/$activeHackathon/hacker-package",
    icon: PackageOpen,
  },
  {
    label: "Schedule",
    to: "/$activeHackathon/schedule",
    icon: Calendar,
  },
  {
    label: "Venue map",
    to: "/$activeHackathon/venue-map",
    icon: MapIcon,
  },
  {
    label: "FAQs",
    to: "/$activeHackathon/faqs",
    icon: Info,
  },
];

const INTERNAL_MENU_ITEMS: MenuItem[] = [
  {
    label: "Charcuterie",
    to: "/$activeHackathon/charcuterie",
    icon: ForkKnife,
  },
];

export function AppSidebar() {
  const { activeHackathon } = useHackathon();
  const { displayNameShort, hackathonYear } = useHackathonInfo();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const logout = useAuthStore((state) => state.logout);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const user = useAuthStore((state) => state.user);
  const hacker = useHackerStore((state) => state.hacker);
  const { isMobile } = useSidebar();
  const LogoComponent = getSidebarHackathonIcon(activeHackathon);
  const navigate = useNavigate();

  const handleSignin = async () => {
    await signInWithGoogle();
    navigate({ to: "/$activeHackathon", params: { activeHackathon } });
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/$activeHackathon", params: { activeHackathon } });
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="relative flex h-16 flex-row items-center justify-between group-data-[collapsible=icon]:justify-center">
        <div className="flex flex-row items-center gap-4 group-data-[collapsible=icon]:hidden">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
            <LogoComponent />
          </div>
          <div className="flex flex-col">
            <div className="font-bold text-sm">{displayNameShort}</div>
            <div className="font-medium text-sm">{hackathonYear}</div>
          </div>
        </div>
        <SidebarTrigger className="size-8" />
      </SidebarHeader>

      <SidebarContent>
        {isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupLabel>Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ACCOUNT_MENU_ITEMS.map(({ label, to, icon: Icon }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild tooltip={label}>
                      <Link
                        to={to}
                        params={{ activeHackathon, userId: user?.uid }}
                        activeProps={{ "data-active": true }}
                      >
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!isAuthenticated && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Home">
                  <Link
                    to="/$activeHackathon/home"
                    params={{ activeHackathon }}
                    activeProps={{ "data-active": true }}
                  >
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Information</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {INFORMATION_MENU_ITEMS.filter(
                (item) => !(item.label === "Hacker package" && !isAuthenticated),
              ).map(({ label, to, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild tooltip={label}>
                    <Link
                      to={to}
                      params={{ activeHackathon }}
                      activeProps={{ "data-active": true }}
                      activeOptions={{ exact: to === "/$activeHackathon" }}
                    >
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {import.meta.env.DEV && isAuthenticated && isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Internal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {INTERNAL_MENU_ITEMS.map(({ label, to, icon: Icon }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild tooltip={label}>
                      <Link
                        to={to}
                        params={{ activeHackathon }}
                        activeProps={{ "data-active": true }}
                      >
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {isAuthenticated && hacker ? (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.photoURL ?? undefined} referrerPolicy="no-referrer" />
                  <AvatarFallback className="rounded-lg">
                    {getFullName(hacker).charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="truncate font-semibold text-sm">{getFullName(hacker)}</span>
                  <span className="truncate text-xs">{hacker.basicInfo.email}</span>
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuAction
                    className="static size-8 group-data-[collapsible=icon]:flex"
                    onClick={handleLogout}
                  >
                    <LogOut />
                  </SidebarMenuAction>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" hidden={isMobile}>
                  Log out
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      ) : (
        <SidebarFooter>
          <div className="flex flex-col gap-3 px-2 pb-2">
            <p className="text-text-secondary text-xs group-data-[collapsible=icon]:hidden">
              If you are a hacker, sign in to view your account.
            </p>
            <Button
              variant="login"
              className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center"
              onClick={handleSignin}
            >
              <GoogleIcon />
              <span className="group-data-[collapsible=icon]:hidden">Log in with Google</span>
            </Button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

export function AppSidebarLayout({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-auto">
        {/* mobile trigger */}
        <SidebarTrigger className="absolute top-4 left-4 z-50 size-6 md:hidden" />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
