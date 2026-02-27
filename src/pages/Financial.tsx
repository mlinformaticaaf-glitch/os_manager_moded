import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialDashboard } from "@/components/financial/FinancialDashboard";
import { TransactionsTable } from "@/components/financial/TransactionsTable";
import { TransactionForm } from "@/components/financial/TransactionForm";
import { FinancialReports } from "@/components/financial/reports/FinancialReports";
import { useFinancialTransactions, FinancialTransactionWithClient } from "@/hooks/useFinancialTransactions";

export default function Financial() {
  const location = useLocation();
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransactionWithClient | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const { transactions } = useFinancialTransactions();

  // Handle navigation state to open a specific transaction
  useEffect(() => {
    const state = location.state as { viewTransactionId?: string } | null;
    if (state?.viewTransactionId && transactions.length > 0) {
      const transactionToEdit = transactions.find(t => t.id === state.viewTransactionId);
      if (transactionToEdit) {
        setSelectedTransaction(transactionToEdit);
        setIsFormOpen(true);
        setActiveTab("payables"); // Switch to payables tab for expense transactions
        // Clear the state to prevent re-opening on subsequent renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, transactions]);

  const handleEdit = (transaction: FinancialTransactionWithClient) => {
    setSelectedTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleNewTransaction = () => {
    setSelectedTransaction(null);
    setIsFormOpen(true);
  };

  return (
    <MainLayout title="Financeiro" subtitle="Gerencie o fluxo de caixa, contas a pagar e receber">
      <div className="space-y-6 animate-fade-in">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="bg-muted/50 w-max sm:w-auto">
              <TabsTrigger value="dashboard" className="text-xs sm:text-sm px-2 sm:px-3">Dashboard</TabsTrigger>
              <TabsTrigger value="receivables" className="text-xs sm:text-sm px-2 sm:px-3">A Receber</TabsTrigger>
              <TabsTrigger value="received" className="text-xs sm:text-sm px-2 sm:px-3">Recebidos</TabsTrigger>
              <TabsTrigger value="payables" className="text-xs sm:text-sm px-2 sm:px-3">A Pagar</TabsTrigger>
              <TabsTrigger value="paid" className="text-xs sm:text-sm px-2 sm:px-3">Pagos</TabsTrigger>
              <TabsTrigger value="reports" className="text-xs sm:text-sm px-2 sm:px-3">Relatórios</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <FinancialDashboard onTransactionClick={handleEdit} />
          </TabsContent>

          <TabsContent value="receivables">
            <TransactionsTable 
              filterType="income"
              filterStatus="pending"
              onEdit={handleEdit}
              onNew={handleNewTransaction}
            />
          </TabsContent>

          <TabsContent value="received">
            <TransactionsTable 
              filterType="income"
              filterStatus="paid"
              onEdit={handleEdit}
              onNew={handleNewTransaction}
            />
          </TabsContent>

          <TabsContent value="payables">
            <TransactionsTable 
              filterType="expense"
              filterStatus="pending"
              onEdit={handleEdit}
              onNew={handleNewTransaction}
            />
          </TabsContent>

          <TabsContent value="paid">
            <TransactionsTable 
              filterType="expense"
              filterStatus="paid"
              onEdit={handleEdit}
              onNew={handleNewTransaction}
            />
          </TabsContent>

          <TabsContent value="all">
            <TransactionsTable 
              onEdit={handleEdit}
              onNew={handleNewTransaction}
            />
          </TabsContent>

          <TabsContent value="reports">
            <FinancialReports />
          </TabsContent>
        </Tabs>

        <TransactionForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          transaction={selectedTransaction}
        />
      </div>
    </MainLayout>
  );
}
