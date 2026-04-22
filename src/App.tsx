import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader2 } from "lucide-react";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Clients = lazy(() => import("./pages/Clients"));
const ServiceOrders = lazy(() => import("./pages/ServiceOrders"));
const Equipment = lazy(() => import("./pages/Equipment"));
const Products = lazy(() => import("./pages/Products"));
const Services = lazy(() => import("./pages/Services"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Sales = lazy(() => import("./pages/Sales"));
const Financial = lazy(() => import("./pages/Financial"));
const Settings = lazy(() => import("./pages/Settings"));
const Kanban = lazy(() => import("./pages/Kanban"));
const Manuals = lazy(() => import("./pages/Manuals"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

function PageFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function AuthRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/auth" element={<AuthRedirect />} />
              <Route path="/auth/callback" element={<Navigate to="/" replace />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute requireOnboarding={true}>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute>
                    <Clients />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/os"
                element={
                  <ProtectedRoute>
                    <ServiceOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/equipamentos"
                element={
                  <ProtectedRoute>
                    <Equipment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/produtos"
                element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/servicos"
                element={
                  <ProtectedRoute>
                    <Services />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fornecedores"
                element={
                  <ProtectedRoute>
                    <Suppliers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/compras"
                element={
                  <ProtectedRoute>
                    <Purchases />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendas"
                element={
                  <ProtectedRoute>
                    <Sales />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/financeiro"
                element={
                  <ProtectedRoute>
                    <Financial />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kanban"
                element={
                  <ProtectedRoute>
                    <Kanban />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manuais"
                element={
                  <ProtectedRoute>
                    <Manuals />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
