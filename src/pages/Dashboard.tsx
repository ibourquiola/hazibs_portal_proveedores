import { useEffect, useState } from "react";
import { useNavigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, FileText, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import logoHbs from "@/assets/logo-hbs.png";
import { useUserRole } from "@/hooks/useUserRole";

interface Supplier {
  id: string;
  name: string;
  logo_url: string | null;
}

const Dashboard = () => {
  const { user, role, loading, supplierId } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (role === "admin") {
        navigate("/admin");
      }
    }
  }, [user, role, loading, navigate]);

  // Fetch supplier data when supplierId is available
  useEffect(() => {
    const fetchSupplier = async () => {
      if (!supplierId) return;
      
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name, logo_url")
        .eq("id", supplierId)
        .maybeSingle();

      if (!error && data) {
        setSupplier(data);
      }
    };

    fetchSupplier();
  }, [supplierId]);

  // Redirect to ofertas if at /dashboard
  useEffect(() => {
    if (location.pathname === "/dashboard") {
      navigate("/dashboard/ofertas", { replace: true });
    }
  }, [location.pathname, navigate]);

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

  const navItems = [
    { to: "/dashboard/ofertas", label: "Ofertas", icon: FileText },
    { to: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 border-b border-border bg-card shadow-card">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {supplier?.logo_url ? (
              <img 
                src={supplier.logo_url} 
                alt={`Logo de ${supplier.name}`} 
                className="h-10 w-auto max-w-[120px] object-contain" 
              />
            ) : (
              <img src={logoHbs} alt="HBS Logo" className="h-10 w-auto" />
            )}
            <div className="border-l border-border pl-4">
              <h1 className="font-semibold text-foreground">
                {supplier?.name || "Portal de Proveedores"}
              </h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      {/* Navigation - Fixed */}
      <nav className="flex-shrink-0 border-b border-border bg-card">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content - Scrollable */}
      <main className="flex-1 overflow-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
