import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Code2,
  Search,
  Settings,
  Moon,
  Sun,
  TrendingUp,
  Dices,
  Menu,
  LogIn,
  LogOut,
  LoaderCircle,
  UserRound,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Header({ onOpenHandleModal }: { onOpenHandleModal?: () => void }) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in could not be started.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("You have been signed out.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-out failed. Please try again.");
    }
  };

  const navigationItems = [
    {
      path: "/",
      label: "Explore Problems",
      icon: Search,
    },
    {
      path: "/statistics",
      label: "View Statistics",
      icon: TrendingUp,
    },
    {
      path: "/training",
      label: "Training Gym",
      icon: Dices,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Code2 className="h-5 w-5" />
          </div>
          <span className="text-lg sm:text-xl font-bold gradient-text">AlgoGym</span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                    isActive(item.path) && "bg-accent text-accent-foreground",
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {authLoading ? (
            <Button variant="outline" size="sm" disabled aria-label="Loading account">
              <LoaderCircle className="h-4 w-4 animate-spin" />
            </Button>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 rounded-full border border-border/70 bg-card/70 pl-1.5 pr-2 hover:bg-accent" aria-label="Open profile menu">
                  <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                    <AvatarImage src={user.user_metadata.avatar_url || user.user_metadata.picture} alt="" />
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{(user.user_metadata.full_name || user.email || "A").slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block max-w-28 truncate text-sm font-medium">{user.user_metadata.full_name || user.email?.split("@")[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="w-72 rounded-xl border-border/70 bg-popover/95 p-2 shadow-xl backdrop-blur">
                <DropdownMenuLabel className="p-2 font-normal">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                      <AvatarImage src={user.user_metadata.avatar_url || user.user_metadata.picture} alt="" />
                      <AvatarFallback className="bg-primary/10 font-semibold text-primary">{(user.user_metadata.full_name || user.email || "A").slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{user.user_metadata.full_name || "AlgoGym member"}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2.5"><Link to="/profile"><UserRound className="mr-2 h-4 w-4" />Your profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2.5"><Link to="/statistics"><TrendingUp className="mr-2 h-4 w-4" />Statistics</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2.5"><Link to="/training"><Dices className="mr-2 h-4 w-4" />Training gym</Link></DropdownMenuItem>
                {onOpenHandleModal && <DropdownMenuItem onSelect={onOpenHandleModal} className="cursor-pointer rounded-lg py-2.5"><Settings className="mr-2 h-4 w-4" />Manage coding handles</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut} className="cursor-pointer rounded-lg py-2.5 text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={handleGoogleSignIn}>
              <LogIn className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Sign in with Google</span>
              <span className="sm:hidden">Sign in</span>
            </Button>
          )}

          <Badge
            variant="outline"
            className="hidden sm:flex bg-primary/10 text-primary border-primary/20"
          >
            Pro
          </Badge>

          {/* Mobile Navigation Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-bold gradient-text">AlgoGym</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActive(item.path) && "bg-accent text-accent-foreground",
                    )}
                    onClick={() => {
                      // Close sheet after navigation
                      const sheetCloseButton = document.querySelector('[data-radix-collection-item]');
                      if (sheetCloseButton) {
                        (sheetCloseButton as HTMLElement).click();
                      }
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-medium">Theme</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="h-8 w-8"
                    >
                      <Sun className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-[1rem] w-[1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
