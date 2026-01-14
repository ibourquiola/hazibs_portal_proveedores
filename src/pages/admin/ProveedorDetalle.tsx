import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Users, FileText, ShoppingCart, Mail, Check, Clock } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  family: string;
  average_billing: number;
}

interface SupplierUser {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  email: string;
  user_id: string | null;
  invitation_sent_at: string | null;
  invitation_accepted_at: string | null;
}

interface OfferApplication {
  id: string;
  order_number: string;
  units: number;
  term: string;
  price_euros: number;
  status: string;
  created_at: string;
  offer: {
    offer_number: string;
    description: string;
  } | null;
}

const ProveedorDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [users, setUsers] = useState<SupplierUser[]>([]);
  const [applications, setApplications] = useState<OfferApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    position: "",
    email: "",
  });

  const fetchSupplier = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching supplier:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el proveedor.",
      });
      navigate("/admin/proveedores");
    } else if (data) {
      setSupplier(data);
    }
  };

  const fetchUsers = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("supplier_users")
      .select("*")
      .eq("supplier_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data || []);
    }
  };

  const fetchApplications = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("offer_applications")
      .select(`
        id,
        order_number,
        units,
        term,
        price_euros,
        status,
        created_at,
        offer:offers (
          offer_number,
          description
        )
      `)
      .eq("supplier_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
    } else {
      setApplications(data || []);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSupplier(), fetchUsers(), fetchApplications()]);
      setLoading(false);
    };
    loadData();
  }, [id]);

  const handleCreateUser = async () => {
    if (!newUser.first_name || !newUser.last_name || !newUser.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nombre, apellidos y email son obligatorios.",
      });
      return;
    }

    setIsSubmitting(true);

    // Create user record
    const { data: userData, error: userError } = await supabase
      .from("supplier_users")
      .insert({
        supplier_id: id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        position: newUser.position || null,
        email: newUser.email,
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating user:", userError);
      toast({
        variant: "destructive",
        title: "Error",
        description: userError.message.includes("unique")
          ? "Ya existe un usuario con ese email."
          : "No se pudo crear el usuario.",
      });
      setIsSubmitting(false);
      return;
    }

    // Send invitation email
    try {
      const response = await supabase.functions.invoke("send-supplier-invitation", {
        body: {
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          supplierName: supplier?.name,
          invitationToken: userData.invitation_token,
        },
      });

      if (response.error) {
        console.error("Error sending invitation:", response.error);
        toast({
          variant: "destructive",
          title: "Usuario creado",
          description: "El usuario se creó pero no se pudo enviar la invitación.",
        });
      } else {
        // Update invitation_sent_at
        await supabase
          .from("supplier_users")
          .update({ invitation_sent_at: new Date().toISOString() })
          .eq("id", userData.id);

        toast({
          title: "Usuario creado",
          description: "Se ha enviado un email de invitación al usuario.",
        });
      }
    } catch (error) {
      console.error("Error invoking function:", error);
      toast({
        variant: "destructive",
        title: "Usuario creado",
        description: "El usuario se creó pero no se pudo enviar la invitación.",
      });
    }

    setNewUser({ first_name: "", last_name: "", position: "", email: "" });
    setIsUserDialogOpen(false);
    fetchUsers();
    setIsSubmitting(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pendiente: { variant: "secondary", label: "Pendiente" },
      confirmado: { variant: "default", label: "Confirmado" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!supplier) {
    return null;
  }

  const confirmedOrders = applications.filter((a) => a.status === "confirmado");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/proveedores")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{supplier.name}</h2>
          <p className="text-muted-foreground">{supplier.family}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Facturación Media
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(supplier.average_billing)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-2">
            <FileText className="w-4 h-4" />
            Ofertas
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Pedidos
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    El usuario recibirá un email para configurar su contraseña
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Nombre *</Label>
                      <Input
                        id="first_name"
                        value={newUser.first_name}
                        onChange={(e) =>
                          setNewUser({ ...newUser, first_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Apellidos *</Label>
                      <Input
                        id="last_name"
                        value={newUser.last_name}
                        onChange={(e) =>
                          setNewUser({ ...newUser, last_name: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      value={newUser.position}
                      onChange={(e) =>
                        setNewUser({ ...newUser, position: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsUserDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    disabled={isSubmitting}
                    className="gradient-primary"
                  >
                    {isSubmitting ? "Creando..." : "Crear y Enviar Invitación"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {users.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay usuarios asociados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.position || "-"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.invitation_accepted_at ? (
                          <Badge variant="default" className="gap-1">
                            <Check className="w-3 h-3" />
                            Activo
                          </Badge>
                        ) : user.invitation_sent_at ? (
                          <Badge variant="secondary" className="gap-1">
                            <Mail className="w-3 h-3" />
                            Invitación enviada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="w-3 h-3" />
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers" className="space-y-4">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay aplicaciones a ofertas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oferta</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead>Plazo</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.offer?.offer_number || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {app.offer?.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {app.units.toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell>{app.term}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(app.price_euros)}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell>{formatDate(app.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          {confirmedOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay pedidos confirmados</p>
              </CardContent>
            </Card>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Pedido</TableHead>
                    <TableHead>Oferta</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead>Plazo</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.offer?.offer_number || "-"}</TableCell>
                      <TableCell className="text-right">
                        {order.units.toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell>{order.term}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.price_euros)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProveedorDetalle;
