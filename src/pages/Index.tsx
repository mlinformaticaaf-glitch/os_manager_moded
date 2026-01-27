import { MainLayout } from "@/components/layout/MainLayout";
import { Dashboard } from "@/pages/Dashboard";

const Index = () => {
  return (
    <MainLayout title="Dashboard" subtitle="Visão geral do sistema">
      <Dashboard />
    </MainLayout>
  );
};

export default Index;
