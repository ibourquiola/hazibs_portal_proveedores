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
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Hash, Package, Clock, Euro, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface OrderWithOffer {
  id: string;
  offer_id: string;
  units: number;
  term: string;
  price_euros: number;
  created_at: string;
  offers: {
    offer_number: string;
    description: string;
  } | null;
}

const Pedidos = () => {
  const [orders, setOrders] = useState<OrderWithOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("offer_applications")
        .select(`
          id,
          offer_id,
          units,
          term,
          price_euros,
          created_at,
          offers (
            offer_number,
            description
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

    fetchOrders();
  }, []);

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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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
                  <TableHead className="font-semibold text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <Calendar className="w-4 h-4" />
                      Fecha
                    </div>
                  </TableHead>
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
                      {order.offers?.offer_number || "-"}
                    </TableCell>
                    <TableCell className="max-w-md">
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
                    <TableCell className="text-center text-muted-foreground">
                      {format(new Date(order.created_at), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Pedidos;
