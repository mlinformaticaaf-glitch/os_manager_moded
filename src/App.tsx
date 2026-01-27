import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Clients from "./pages/Clients";
import ServiceOrders from "./pages/ServiceOrders";
import Equipment from "./pages/Equipment";
import Products from "./pages/Products";
import Services from "./pages/Services";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Financial from "./pages/Financial";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
          <Routes>
            <Route path="/auth" element={<AuthRedirect />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
