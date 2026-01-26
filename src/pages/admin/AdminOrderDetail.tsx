import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Package, 
  Calendar, 
  Euro, 
  Hash, 
  CheckCircle2,
  AlertCircle,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type OrderStatus = "pendiente" | "confirmado";

interface Order {
  id: string;
  order_number: string;
  offer_id: string | null;
  status: OrderStatus;
  created_at: string;
  offers: {
    offer_number: string;
    description: string;
  } | null;
  supplier: {
    name: string;
  } | null;
}

interface OrderLine {
  id: string;
  offer_application_id: string;
  article_code: string;
  description: string;
  requested_units: number;
  requested_term: string | null;
  requested_price: number | null;
}

interface LineConfirmation {
  id: string;
  order_line_id: string;
  offer_application_id: string;
  article_code: string;
  confirmed_units: number;
  confirmed_term: string;
  confirmed_price: number;
}

const AdminOrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [confirmations, setConfirmations] = useState<LineConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCode, setFilterCode] = useState("");

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  const fetchOrderData = async () => {
    setLoading(true);

    // Fetch order
    const { data: orderData, error: orderError } = await supabase
      .from("offer_applications")
      .select(`
        id,
        order_number,
        offer_id,
        status,
        created_at,
        offers (
          offer_number,
          description
        ),
        supplier:suppliers (
          name
        )
      `)
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !orderData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el pedido.",
      });
      navigate("/admin/pedidos");
      return;
    }

    setOrder(orderData as Order);

    // Fetch order lines
    const { data: linesData, error: linesError } = await supabase
      .from("order_lines")
      .select("*")
      .eq("offer_application_id", orderId)
      .order("article_code");

    if (linesError) {
      console.error("Error fetching order lines:", linesError);
    } else {
      setOrderLines(linesData || []);
    }

    // Fetch existing confirmations
    const { data: confirmationsData, error: confirmationsError } = await supabase
      .from("order_line_confirmations")
      .select("*")
      .eq("offer_application_id", orderId)
      .order("created_at");

    if (confirmationsError) {
      console.error("Error fetching confirmations:", confirmationsError);
    } else {
      setConfirmations(confirmationsData || []);
    }

    setLoading(false);
  };

  // Calculate confirmed units per article
  const confirmedUnitsPerArticle = useMemo(() => {
    const result: Record<string, number> = {};
    confirmations.forEach((c) => {
      result[c.article_code] = (result[c.article_code] || 0) + c.confirmed_units;
    });
    return result;
  }, [confirmations]);

  // Filter order lines
  const filteredOrderLines = useMemo(() => {
    if (!filterCode) return orderLines;
    return orderLines.filter((line) =>
      line.article_code.toLowerCase().includes(filterCode.toLowerCase())
    );
  }, [orderLines, filterCode]);

  // Get requested units per article
  const requestedUnitsPerArticle = useMemo(() => {
    const result: Record<string, number> = {};
    orderLines.forEach((line) => {
      result[line.article_code] = line.requested_units;
    });
    return result;
  }, [orderLines]);

  const getUnitPercentage = (articleCode: string): number => {
    const confirmed = confirmedUnitsPerArticle[articleCode] || 0;
    const requested = requestedUnitsPerArticle[articleCode] || 1;
    return (confirmed / requested) * 100;
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
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate("/admin/pedidos")} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Volver a pedidos
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-primary" />
                <CardTitle className="text-xl sm:text-2xl font-bold">
                  {order.order_number}
                </CardTitle>
                {getStatusBadge(order.status)}
              </div>
              {order.supplier && (
                <p className="text-sm text-muted-foreground">
                  Proveedor: <span className="font-medium">{order.supplier.name}</span>
                </p>
              )}
              {order.offers && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Oferta: {order.offers.offer_number}</span>
                  <span>•</span>
                  <span>{order.offers.description}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Creado: {format(new Date(order.created_at), "dd MMM yyyy", { locale: es })}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Order Lines Table (Top) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Líneas del pedido solicitadas
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por código..."
                value={filterCode}
                onChange={(e) => setFilterCode(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orderLines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay líneas en este pedido</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Cód. Artículo
                      </div>
                    </TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Uds. Solicitadas</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Plazo Solicitado</TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Euro className="w-4 h-4" />
                        Precio Solicitado
                      </div>
                    </TableHead>
                    <TableHead className="text-center whitespace-nowrap">% Confirmado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrderLines.map((line) => {
                    const percentage = getUnitPercentage(line.article_code);
                    const isNearLimit = percentage > 90 && percentage < 100;
                    const isAtLimit = percentage >= 100;

                    return (
                      <TableRow key={line.id}>
                        <TableCell className="font-mono font-medium">
                          {line.article_code}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="truncate">{line.description}</p>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {line.requested_units.toLocaleString("es-ES")}
                        </TableCell>
                        <TableCell className="text-center">
                          {line.requested_term
                            ? format(new Date(line.requested_term), "dd/MM/yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(line.requested_price)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-medium",
                              isAtLimit && "bg-green-100 text-green-800 border-green-200",
                              isNearLimit && "bg-amber-100 text-amber-800 border-amber-200",
                              !isNearLimit && !isAtLimit && "bg-muted"
                            )}
                          >
                            {percentage.toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Confirmations Table (Bottom) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Confirmaciones del proveedor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {confirmations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay confirmaciones todavía</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Cód. Artículo
                      </div>
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">Uds. Confirmadas</TableHead>
                    <TableHead className="text-center whitespace-nowrap">Plazo Confirmado</TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Euro className="w-4 h-4" />
                        Precio Confirmado
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmations.map((conf) => (
                    <TableRow key={conf.id}>
                      <TableCell className="font-mono font-medium">
                        {conf.article_code}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {conf.confirmed_units.toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell className="text-center">
                        {format(new Date(conf.confirmed_term), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(conf.confirmed_price)}
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

export default AdminOrderDetail;
