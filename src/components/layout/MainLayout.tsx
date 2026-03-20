import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleNavigate = (path: string) => {
    navigate(path);
  };


  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Até logo!",
      description: "Você saiu do sistema.",
    });
    navigate("/auth");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden w-full">
      <Sidebar currentPath={location.pathname} onNavigate={handleNavigate} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          title={title}
          subtitle={subtitle}
          userEmail={user?.email}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
