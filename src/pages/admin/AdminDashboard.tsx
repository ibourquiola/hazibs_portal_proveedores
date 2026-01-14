import { useEffect } from "react";
import { useNavigate, NavLink, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Users, FileText, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import logoHbs from "@/assets/logo-hbs.png";
import { useUserRole } from "@/hooks/useUserRole";

const AdminDashboard = () => {
  const { user, role, loading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (role !== "admin") {
        navigate("/login");
        toast({
          variant: "destructive",
          title: "Acceso denegado",
          description: "No tienes permisos de administrador.",
        });
      }
    }
  }, [user, role, loading, navigate, toast]);

  // Redirect to proveedores if at /admin
  useEffect(() => {
    if (location.pathname === "/admin") {
      navigate("/admin/proveedores", { replace: true });
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

  if (!user || role !== "admin") {
    return null;
  }

  const navItems = [
    { to: "/admin/proveedores", label: "Proveedores", icon: Users },
    { to: "/admin/ofertas", label: "Ofertas", icon: FileText },
    { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 border-b border-border bg-card shadow-card">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoHbs} alt="HBS Logo" className="h-10 w-auto" />
            <div className="border-l border-border pl-4">
              <h1 className="font-semibold text-foreground">Panel de Administración</h1>
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

export default AdminDashboard;
