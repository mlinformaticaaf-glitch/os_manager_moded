import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function ClearDataCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const CONFIRMATION_TEXT = "APAGAR TUDO";

  const handleClearData = async () => {
    if (!user?.id) return;

    setIsDeleting(true);
    try {
      // Get IDs first for related tables
      const { data: serviceOrders } = await supabase
        .from('service_orders')
        .select('id')
        .eq('user_id', user.id);

      const { data: purchases } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.id);

      // Delete in order to respect foreign key constraints
      // 1. Delete service order items first (depends on service_orders)
      if (serviceOrders && serviceOrders.length > 0) {
        const osIds = serviceOrders.map(so => so.id);
        await supabase
          .from('service_order_items')
          .delete()
          .in('service_order_id', osIds);
      }

      // 2. Delete service orders
      const { error: osError } = await supabase
        .from('service_orders')
        .delete()
        .eq('user_id', user.id);

      // 3. Delete purchase items (depends on purchases)
      if (purchases && purchases.length > 0) {
        const purchaseIds = purchases.map(p => p.id);
        await supabase
          .from('purchase_items')
          .delete()
          .in('purchase_id', purchaseIds);
      }

      // 4. Delete purchases
      const { error: purchasesError } = await supabase
        .from('purchases')
        .delete()
        .eq('user_id', user.id);

      // 5. Delete financial transactions
      const { error: financialError } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('user_id', user.id);

      // 6. Delete clients
      const { error: clientsError } = await supabase
        .from('clients')
        .delete()
        .eq('user_id', user.id);

      // 7. Delete products
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .eq('user_id', user.id);

      // 8. Delete services
      const { error: servicesError } = await supabase
        .from('services')
        .delete()
        .eq('user_id', user.id);

      // 9. Delete suppliers
      const { error: suppliersError } = await supabase
        .from('suppliers')
        .delete()
        .eq('user_id', user.id);

      // 10. Delete equipment
      const { error: equipmentError } = await supabase
        .from('equipment')
        .delete()
        .eq('user_id', user.id);

      const errors = [
        osError, purchasesError, financialError, clientsError, 
        productsError, servicesError, suppliersError, equipmentError
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error('Errors during data deletion:', errors);
        throw new Error('Alguns dados não puderam ser excluídos');
      }

      // Invalidate all queries to refresh the UI
      queryClient.invalidateQueries();

      toast({
        title: "Dados excluídos",
        description: "Todos os seus dados foram removidos com sucesso.",
      });

      setShowFinalConfirm(false);
      setConfirmText("");
    } catch (error: any) {
      toast({
        title: "Erro ao excluir dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Zona de Perigo
        </CardTitle>
        <CardDescription>
          Ações irreversíveis que afetam todos os seus dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <h4 className="font-medium text-destructive mb-2">Limpar Todos os Dados</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Esta ação irá excluir permanentemente todos os seus registros, incluindo:
              clientes, produtos, serviços, ordens de serviço, transações financeiras,
              compras, fornecedores e equipamentos. Esta ação não pode ser desfeita.
            </p>

            <AlertDialog open={showFinalConfirm} onOpenChange={setShowFinalConfirm}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Banco de Dados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Confirmar Exclusão Total
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      Você está prestes a excluir <strong>TODOS</strong> os seus dados permanentemente.
                      Esta ação não pode ser desfeita.
                    </p>
                    <p>
                      Para confirmar, digite <strong>{CONFIRMATION_TEXT}</strong> no campo abaixo:
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4">
                  <Label htmlFor="confirm-delete">Confirmação</Label>
                  <Input
                    id="confirm-delete"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={CONFIRMATION_TEXT}
                    className="mt-2"
                  />
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText("")}>
                    Cancelar
                  </AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleClearData}
                    disabled={confirmText !== CONFIRMATION_TEXT || isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Tudo
                      </>
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
