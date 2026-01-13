import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, LogOut, Package, FileText, CheckCircle, XCircle } from "lucide-react";
import { OffersTable } from "@/components/OffersTable";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
    });
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Portal de Proveedores</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<FileText className="w-5 h-5" />}
            label="Total Ofertas"
            value="8"
            color="primary"
          />
          <StatCard
            icon={<Package className="w-5 h-5" />}
            label="Abiertas"
            value="4"
            color="open"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Aceptadas"
            value="1"
            color="accepted"
          />
          <StatCard
            icon={<XCircle className="w-5 h-5" />}
            label="Rechazadas"
            value="1"
            color="rejected"
          />
        </div>

        {/* Offers section */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Listado de Ofertas
            </CardTitle>
            <CardDescription>
              Consulta y gestiona las ofertas disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OffersTable />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "primary" | "open" | "applied" | "accepted" | "rejected";
}

const StatCard = ({ icon, label, value, color }: StatCardProps) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    open: "bg-status-open-bg text-status-open",
    applied: "bg-status-applied-bg text-status-applied",
    accepted: "bg-status-accepted-bg text-status-accepted",
    rejected: "bg-status-rejected-bg text-status-rejected",
  };

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
