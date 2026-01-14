import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Building2, ChevronRight } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  family: string;
  average_billing: number;
  created_at: string;
}

const Proveedores = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    family: "",
    average_billing: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching suppliers:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los proveedores.",
      });
    } else {
      setSuppliers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreateSupplier = async () => {
    if (!newSupplier.name || !newSupplier.family) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre y la familia son obligatorios.",
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("suppliers").insert({
      name: newSupplier.name,
      family: newSupplier.family,
      average_billing: parseFloat(newSupplier.average_billing) || 0,
    });

    if (error) {
      console.error("Error creating supplier:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el proveedor.",
      });
    } else {
      toast({
        title: "Proveedor creado",
        description: "El proveedor se ha creado correctamente.",
      });
      setNewSupplier({ name: "", family: "", average_billing: "" });
      setIsDialogOpen(false);
      fetchSuppliers();
    }

    setIsSubmitting(false);
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.family.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Proveedores</h2>
          <p className="text-muted-foreground">
            Gestiona los proveedores y sus usuarios
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Proveedor</DialogTitle>
              <DialogDescription>
                Introduce los datos del nuevo proveedor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Nombre del proveedor"
                  value={newSupplier.name}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="family">Familia *</Label>
                <Input
                  id="family"
                  placeholder="Familia del proveedor"
                  value={newSupplier.family}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, family: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing">Facturación Media (€)</Label>
                <Input
                  id="billing"
                  type="number"
                  placeholder="0"
                  value={newSupplier.average_billing}
                  onChange={(e) =>
                    setNewSupplier({
                      ...newSupplier,
                      average_billing: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateSupplier}
                disabled={isSubmitting}
                className="gradient-primary"
              >
                {isSubmitting ? "Creando..." : "Crear Proveedor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o familia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      {filteredSuppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">
            No hay proveedores
          </h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm
              ? "No se encontraron proveedores con esos criterios"
              : "Crea el primer proveedor para empezar"}
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Familia</TableHead>
                <TableHead className="text-right">Facturación Media</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/admin/proveedores/${supplier.id}`)}
                >
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.family}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(supplier.average_billing)}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Proveedores;
