import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, FileText } from "lucide-react";

type OfferStatus = "abierta" | "aplicada" | "aceptada" | "rechazada";

interface Offer {
  id: string;
  offer_number: string;
  description: string;
  minimum_units: number;
  status: OfferStatus;
  deadline: string | null;
  created_at: string;
}

const AdminOfertas = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchOffers = async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching offers:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las ofertas.",
        });
      } else {
        setOffers(data || []);
      }
      setLoading(false);
    };

    fetchOffers();
  }, []);

  const getStatusBadge = (status: OfferStatus) => {
    const variants: Record<OfferStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      abierta: { variant: "default", label: "Abierta" },
      aplicada: { variant: "secondary", label: "Aplicada" },
      aceptada: { variant: "default", label: "Aceptada" },
      rechazada: { variant: "destructive", label: "Rechazada" },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const filteredOffers = offers.filter(
    (offer) =>
      offer.offer_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
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
      <div>
        <h2 className="text-2xl font-bold text-foreground">Ofertas</h2>
        <p className="text-muted-foreground">
          Vista general de todas las ofertas del sistema
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      {filteredOffers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No hay ofertas</h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm
              ? "No se encontraron ofertas con esos criterios"
              : "No hay ofertas en el sistema"}
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Oferta</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Uds. Mínimas</TableHead>
                <TableHead>Fecha Límite</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOffers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">{offer.offer_number}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {offer.description}
                  </TableCell>
                  <TableCell className="text-right">
                    {offer.minimum_units.toLocaleString("es-ES")}
                  </TableCell>
                  <TableCell>{formatDate(offer.deadline)}</TableCell>
                  <TableCell>{getStatusBadge(offer.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminOfertas;
