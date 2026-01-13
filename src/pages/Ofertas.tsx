import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Package, Hash, Calendar, Send } from "lucide-react";
import { ApplyOfferModal } from "@/components/ApplyOfferModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

const Ofertas = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchOffers = async () => {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching offers:", error);
    } else {
      setOffers(data as Offer[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const getStatusBadge = (status: OfferStatus) => {
    const statusConfig = {
      abierta: {
        label: "Abierta",
        className: "bg-status-open-bg text-status-open border-status-open/20",
      },
      aplicada: {
        label: "Aplicada",
        className: "bg-status-applied-bg text-status-applied border-status-applied/20",
      },
      aceptada: {
        label: "Aceptada",
        className: "bg-status-accepted-bg text-status-accepted border-status-accepted/20",
      },
      rechazada: {
        label: "Rechazada",
        className: "bg-status-rejected-bg text-status-rejected border-status-rejected/20",
      },
    };

    const config = statusConfig[status];

    return (
      <Badge variant="outline" className={`${config.className} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const handleApplyClick = (offer: Offer) => {
    setSelectedOffer(offer);
    setModalOpen(true);
  };

  const handleApplicationSuccess = () => {
    fetchOffers();
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Listado de Ofertas
          </CardTitle>
          <CardDescription>Consulta y gestiona las ofertas disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 w-28" />
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Listado de Ofertas
          </CardTitle>
          <CardDescription>Consulta y gestiona las ofertas disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay ofertas disponibles</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Nº Oferta
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Descripción
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Package className="w-4 h-4" />
                        Uds. Mínimas
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Calendar className="w-4 h-4" />
                        Deadline
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center">Estado</TableHead>
                    <TableHead className="font-semibold text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((offer, index) => (
                    <TableRow
                      key={offer.id}
                      className="animate-fade-in hover:bg-accent/50 transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-mono font-medium text-primary">
                        {offer.offer_number}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate">{offer.description}</p>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {offer.minimum_units.toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell className="text-center">
                        {offer.deadline
                          ? format(new Date(offer.deadline), "dd MMM yyyy", { locale: es })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(offer.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleApplyClick(offer)}
                        >
                          <Send className="w-4 h-4" />
                          Aplicar oferta
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOffer && (
        <ApplyOfferModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          offer={selectedOffer}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </>
  );
};

export default Ofertas;
