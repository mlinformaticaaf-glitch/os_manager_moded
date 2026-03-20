import { Plus, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationsDropdown } from "./NotificationsDropdown";

interface HeaderProps {
  title: string;
  subtitle?: string;
  userEmail?: string | null;
  onLogout?: () => void;
}

export function Header({ title, subtitle, userEmail, onLogout }: HeaderProps) {
  const isMobile = useIsMobile();

  return (
    <header className="h-14 md:h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-foreground truncate max-w-[180px] md:max-w-none">{title}</h1>
        {subtitle && !isMobile && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications */}
        <NotificationsDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 md:gap-3 md:pl-4 md:border-l md:border-border hover:opacity-80 transition-opacity">
              {!isMobile && (
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {userEmail?.split("@")[0] || "Usuário"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {userEmail || "Técnico"}
                  </p>
                </div>
              )}
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
