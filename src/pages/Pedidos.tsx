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
import { ShoppingCart, Hash, Package, Clock, Euro, Calendar, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { OrderDetailModal } from "@/components/OrderDetailModal";

type OrderStatus = "pendiente" | "confirmado";

interface OrderWithOffer {
  id: string;
  order_number: string;
  offer_id: string | null;
  units: number;
  term: string;
  price_euros: number;
  status: OrderStatus;
  verified_at: string | null;
  created_at: string;
  offers: {
    offer_number: string;
    description: string;
    minimum_units: number;
    deadline: string | null;
  } | null;
}

const Pedidos = () => {
  const [orders, setOrders] = useState<OrderWithOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithOffer | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("offer_applications")
      .select(`
        id,
        order_number,
        offer_id,
        units,
        term,
        price_euros,
        status,
        verified_at,
        created_at,
        offers (
          offer_number,
          description,
          minimum_units,
          deadline
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      setOrders(data as OrderWithOffer[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewClick = (order: OrderWithOffer) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const handleSuccess = () => {
    fetchOrders();
  };

  const getStatusBadge = (status: OrderStatus) => {
    if (status === "confirmado") {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Confirmado
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Listado de Pedidos
          </CardTitle>
          <CardDescription>Pedidos generados a partir de tus aplicaciones</CardDescription>
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
                <Skeleton className="h-12 w-24" />
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
            <ShoppingCart className="w-5 h-5 text-primary" />
            Listado de Pedidos
          </CardTitle>
          <CardDescription>Pedidos generados a partir de tus aplicaciones</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tienes pedidos registrados</p>
              <p className="text-sm text-muted-foreground mt-1">
                Aplica a ofertas para generar pedidos
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Nº Pedido
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Nº Oferta
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold">Descripción</TableHead>
                    <TableHead className="font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Package className="w-4 h-4" />
                        Unidades
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Clock className="w-4 h-4" />
                        Plazo
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Euro className="w-4 h-4" />
                        Precio
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center">Estado</TableHead>
                    <TableHead className="font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Calendar className="w-4 h-4" />
                        Fecha
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, index) => (
                    <TableRow
                      key={order.id}
                      className="animate-fade-in hover:bg-accent/50 transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-mono font-medium text-primary">
                        {order.order_number}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {order.offers?.offer_number || "-"}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate">{order.offers?.description || "-"}</p>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {order.units.toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell className="text-center">{order.term}</TableCell>
                      <TableCell className="text-center font-medium">
                        {order.price_euros.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {format(new Date(order.created_at), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant={order.status === "pendiente" ? "default" : "outline"}
                          className="gap-2"
                          onClick={() => handleViewClick(order)}
                        >
                          {order.status === "pendiente" ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Confirmar pedido
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Ver detalle
                            </>
                          )}
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

      {selectedOrder && (
        <OrderDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          order={selectedOrder}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};

export default Pedidos;
