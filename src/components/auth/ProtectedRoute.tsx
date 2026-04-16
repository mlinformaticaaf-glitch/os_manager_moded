import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
}

export function ProtectedRoute({ children, requireOnboarding = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (!user) {
      setCheckingOnboarding(false);
      return;
    }

    // Check if onboarding is completed
    const checkOnboarding = async () => {
      try {
        const { data, error } = await supabase
          .from("company_settings")
          .select("onboarding_completed, name, address, phone")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error checking onboarding:", error);
          setOnboardingCompleted(false);
        } else {
          // Consider onboarding completed if:
          // 1. onboarding_completed flag is true, OR
          // 2. Company has existing data (name, address, phone filled)
          const hasCompanyData = data?.name || data?.address || data?.phone;
          const isCompleted = data?.onboarding_completed || hasCompanyData || false;
          setOnboardingCompleted(isCompleted);
        }
      } catch (err) {
        console.error("Error:", err);
        setOnboardingCompleted(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [user]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname + location.search }} replace />;
  }

  // Onboarding é opcional - nunca redirecionar automaticamente
  // Apenas redirecionar se tentar acessar onboarding quando já foi completo
  if (onboardingCompleted && requireOnboarding) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
