import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Package, 
  Wrench,
  DollarSign,
  ShoppingCart,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useServiceOrders } from "@/hooks/useServiceOrders";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

const baseNavItems: Omit<NavItem, 'badge'>[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: ClipboardList, label: "Ordens de Serviço", href: "/os" },
  { icon: Users, label: "Clientes", href: "/clientes" },
  { icon: Package, label: "Produtos", href: "/produtos" },
  { icon: Wrench, label: "Serviços", href: "/servicos" },
  { icon: DollarSign, label: "Financeiro", href: "/financeiro" },
  { icon: ShoppingCart, label: "Compras", href: "/compras" },
  { icon: Building2, label: "Fornecedores", href: "/fornecedores" },
];

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout?: () => void;
}

function SidebarContent({ 
  currentPath, 
  onNavigate, 
  onLogout, 
  collapsed = false,
  onCollapse,
  onItemClick,
  navItems
}: SidebarProps & { 
  collapsed?: boolean; 
  onCollapse?: () => void;
  onItemClick?: () => void;
  navItems: NavItem[];
}) {
  const handleNavigate = (path: string) => {
    onNavigate(path);
    onItemClick?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-lg tracking-tight">OS Manager</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sistema de Gestão</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <ClipboardList className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => handleNavigate(item.href)}
            className={cn(
              "sidebar-link w-full",
              currentPath === item.href && "active"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left text-sm">{item.label}</span>
                {item.badge && (
                  <span className="bg-primary/20 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Settings, Logout & Collapse */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => handleNavigate("/configuracoes")}
          className={cn(
            "sidebar-link w-full",
            currentPath === "/configuracoes" && "active"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm">Configurações</span>}
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className="sidebar-link w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm">Sair</span>}
          </button>
        )}
        
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="sidebar-link w-full justify-center"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Recolher</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ currentPath, onNavigate, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { orders: serviceOrders } = useServiceOrders();

  const navItems = useMemo(() => {
    const openOSCount = serviceOrders.filter(os => 
      !['completed', 'delivered', 'cancelled'].includes(os.status)
    ).length;

    return baseNavItems.map(item => ({
      ...item,
      badge: item.href === '/os' && openOSCount > 0 ? openOSCount : undefined
    }));
  }, [serviceOrders]);

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed top-3 left-3 z-50 md:hidden bg-background/80 backdrop-blur-sm border border-border"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar border-sidebar-border">
          <SidebarContent 
            currentPath={currentPath} 
            onNavigate={onNavigate} 
            onLogout={onLogout}
            onItemClick={() => setMobileOpen(false)}
            navItems={navItems}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 hidden md:flex",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <SidebarContent 
        currentPath={currentPath} 
        onNavigate={onNavigate} 
        onLogout={onLogout}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
        navItems={navItems}
      />
    </aside>
  );
}
