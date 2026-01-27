import { useState, useEffect, useRef } from "react";
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
import { ArrowLeft, Plus, Users, FileText, ShoppingCart, Mail, Check, Clock, Upload, Image, Trash2 } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  family: string;
  average_billing: number;
  logo_url: string | null;
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

interface OrderConfirmation {
  id: string;
  offer_application_id: string;
  units: number;
  term: string;
  price_euros: number;
  confirmed_at: string;
  offer_application: {
    order_number: string;
    offer: {
      offer_number: string;
    } | null;
  } | null;
}

const ProveedorDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [users, setUsers] = useState<SupplierUser[]>([]);
  const [applications, setApplications] = useState<OfferApplication[]>([]);
  const [confirmations, setConfirmations] = useState<OrderConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
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

  const fetchConfirmations = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("order_confirmations")
      .select(`
        id,
        offer_application_id,
        units,
        term,
        price_euros,
        confirmed_at,
        offer_application:offer_applications (
          order_number,
          offer:offers (
            offer_number
          )
        )
      `)
      .eq("supplier_id", id)
      .order("confirmed_at", { ascending: false });

    if (error) {
      console.error("Error fetching confirmations:", error);
    } else {
      setConfirmations(data || []);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSupplier(), fetchUsers(), fetchApplications(), fetchConfirmations()]);
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    // Validate file type
    if (!file.type.startsWith('image/jpeg') && !file.type.startsWith('image/png')) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Solo se permiten archivos JPG o PNG.",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El archivo no puede superar 2MB.",
      });
      return;
    }

    setIsUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}.${fileExt}`;

      // Delete old logo if exists
      if (supplier?.logo_url) {
        const oldPath = supplier.logo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('supplier-logos').remove([oldPath]);
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('supplier-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('supplier-logos')
        .getPublicUrl(fileName);

      // Update supplier record
      const { error: updateError } = await supabase
        .from('suppliers')
        .update({ logo_url: publicUrl })
        .eq('id', id);

      if (updateError) throw updateError;

      setSupplier(prev => prev ? { ...prev, logo_url: publicUrl } : null);
      toast({
        title: "Logo actualizado",
        description: "El logo del proveedor se ha subido correctamente.",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo subir el logo.",
      });
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteLogo = async () => {
    if (!id || !supplier?.logo_url) return;

    setIsUploadingLogo(true);

    try {
      const oldPath = supplier.logo_url.split('/').pop();
      if (oldPath) {
        await supabase.storage.from('supplier-logos').remove([oldPath]);
      }

      const { error: updateError } = await supabase
        .from('suppliers')
        .update({ logo_url: null })
        .eq('id', id);

      if (updateError) throw updateError;

      setSupplier(prev => prev ? { ...prev, logo_url: null } : null);
      toast({
        title: "Logo eliminado",
        description: "El logo del proveedor se ha eliminado.",
      });
    } catch (error) {
      console.error("Error deleting logo:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el logo.",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/proveedores")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        {/* Logo Section */}
        <div className="relative group">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleLogoUpload}
            className="hidden"
          />
          {supplier.logo_url ? (
            <div className="relative">
              <img
                src={supplier.logo_url}
                alt={`Logo de ${supplier.name}`}
                className="w-16 h-16 object-contain rounded-lg border border-border bg-white"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  <Upload className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/20"
                  onClick={handleDeleteLogo}
                  disabled={isUploadingLogo}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-16 h-16 flex flex-col items-center justify-center gap-1 text-muted-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingLogo}
            >
              {isUploadingLogo ? (
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              ) : (
                <>
                  <Image className="w-5 h-5" />
                  <span className="text-[10px]">Logo</span>
                </>
              )}
            </Button>
          )}
        </div>

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
              Confirmaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmations.length}</div>
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
          {confirmations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay confirmaciones de pedidos</p>
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
                    <TableHead>Fecha Confirmación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmations.map((confirmation) => (
                    <TableRow key={confirmation.id}>
                      <TableCell className="font-medium">
                        {confirmation.offer_application?.order_number || "-"}
                      </TableCell>
                      <TableCell>
                        {confirmation.offer_application?.offer?.offer_number || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {confirmation.units.toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell>{confirmation.term}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(confirmation.price_euros)}
                      </TableCell>
                      <TableCell>{formatDate(confirmation.confirmed_at)}</TableCell>
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
