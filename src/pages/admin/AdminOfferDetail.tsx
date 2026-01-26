import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, FileText, Package, Calendar, Euro, Hash } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type OfferStatus = "abierta" | "aplicada" | "aceptada" | "rechazada";

interface Offer {
  id: string;
  offer_number: string;
  description: string;
  status: OfferStatus;
  deadline: string | null;
  minimum_units: number;
}

interface OfferLine {
  id: string;
  offer_id: string;
  material_code: string;
  material_description: string;
  requested_units: number;
  deadline: string | null;
  reference_price: number | null;
  confirmed_units: number | null;
  confirmed_price: number | null;
}

const AdminOfferDetail = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [offer, setOffer] = useState<Offer | null>(null);
  const [lines, setLines] = useState<OfferLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (offerId) {
      fetchOfferData();
    }
  }, [offerId]);

  const fetchOfferData = async () => {
    setLoading(true);
    
    // Fetch offer
    const { data: offerData, error: offerError } = await supabase
      .from("offers")
      .select("*")
      .eq("id", offerId)
      .maybeSingle();

    if (offerError || !offerData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la oferta.",
      });
      navigate("/admin/ofertas");
      return;
    }

    setOffer(offerData as Offer);

    // Fetch offer lines
    const { data: linesData, error: linesError } = await supabase
      .from("offer_lines")
      .select("*")
      .eq("offer_id", offerId)
      .order("material_code");

    if (linesError) {
      console.error("Error fetching lines:", linesError);
    } else {
      setLines(linesData || []);
    }

    setLoading(false);
  };

  const getStatusBadge = (status: OfferStatus) => {
    const statusConfig = {
      abierta: {
        label: "Abierta",
        className: "bg-muted text-muted-foreground border-border",
      },
      aplicada: {
        label: "Aplicada",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      aceptada: {
        label: "Aceptada",
        className: "bg-green-100 text-green-800 border-green-200",
      },
      rechazada: {
        label: "Rechazada",
        className: "bg-red-100 text-red-800 border-red-200",
      },
    };

    const config = statusConfig[status];
    return (
      <Badge variant="outline" className={`${config.className} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/admin/ofertas")} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Volver a ofertas
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                <CardTitle className="text-xl sm:text-2xl font-bold">
                  {offer.offer_number}
                </CardTitle>
                {getStatusBadge(offer.status)}
              </div>
              <p className="text-muted-foreground">{offer.description}</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              {offer.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Fecha límite: {format(new Date(offer.deadline), "dd MMM yyyy", { locale: es })}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>Uds. mínimas: {offer.minimum_units.toLocaleString("es-ES")}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lines Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            Líneas de la oferta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lines.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay líneas en esta oferta</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Cód. Material
                      </div>
                    </TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Uds. Solicitadas</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Deadline</TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Euro className="w-4 h-4" />
                        Precio Ref.
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap bg-primary/5">
                      Uds. Confirmadas
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap bg-primary/5">
                      Precio Confirmado
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono font-medium">
                        {line.material_code}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate">{line.material_description}</p>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {line.requested_units.toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell className="text-center">
                        {line.deadline
                          ? format(new Date(line.deadline), "dd/MM/yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.reference_price)}
                      </TableCell>
                      <TableCell className="text-right bg-primary/5 font-medium">
                        {line.confirmed_units !== null
                          ? line.confirmed_units.toLocaleString("es-ES")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right bg-primary/5 font-medium">
                        {formatCurrency(line.confirmed_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOfferDetail;
