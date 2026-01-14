import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff } from "lucide-react";
import logoHbs from "@/assets/logo-hbs.png";

const SetupPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [supplierUser, setSupplierUser] = useState<{
    id: string;
    email: string;
    first_name: string;
    supplier_id: string;
  } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast({
          variant: "destructive",
          title: "Token inválido",
          description: "El enlace de invitación no es válido.",
        });
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("supplier_users")
        .select("id, email, first_name, supplier_id")
        .eq("invitation_token", token)
        .is("user_id", null)
        .maybeSingle();

      if (error || !data) {
        toast({
          variant: "destructive",
          title: "Token inválido",
          description: "El enlace de invitación ha expirado o ya fue utilizado.",
        });
        navigate("/login");
        return;
      }

      setSupplierUser(data);
      setIsValidating(false);
    };

    validateToken();
  }, [token, navigate, toast]);

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las contraseñas no coinciden.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    if (!supplierUser) return;

    setIsLoading(true);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: supplierUser.email,
      password,
    });

    if (authError || !authData.user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: authError?.message || "No se pudo crear la cuenta.",
      });
      setIsLoading(false);
      return;
    }

    // Update supplier_user with user_id and mark invitation as accepted
    const { error: updateError } = await supabase
      .from("supplier_users")
      .update({
        user_id: authData.user.id,
        invitation_accepted_at: new Date().toISOString(),
        invitation_token: null,
      })
      .eq("id", supplierUser.id);

    if (updateError) {
      console.error("Error updating supplier user:", updateError);
    }

    // Create user_role entry
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: "supplier",
      });

    if (roleError) {
      console.error("Error creating user role:", roleError);
    }

    toast({
      title: "¡Cuenta configurada!",
      description: "Tu cuenta ha sido creada correctamente.",
    });

    // Sign in the user
    await supabase.auth.signInWithPassword({
      email: supplierUser.email,
      password,
    });

    navigate("/dashboard");
    setIsLoading(false);
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Validando enlace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <img src={logoHbs} alt="HBS Logo" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Configura tu cuenta</h1>
          <p className="text-muted-foreground mt-2">
            Hola {supplierUser?.first_name}, crea tu contraseña para acceder al portal
          </p>
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader className="pb-4">
            <CardTitle>Crear Contraseña</CardTitle>
            <CardDescription>
              Tu email: {supplierUser?.email}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSetupPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                {isLoading ? "Configurando..." : "Crear cuenta"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2026 Hazi Business Solutions. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default SetupPassword;
