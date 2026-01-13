import { useEffect, useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Hash, Package, Clock, Euro, Calendar, Eye, CheckCircle2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { OrderDetailModal } from "@/components/OrderDetailModal";

type OrderStatus = "pendiente" | "confirmado";
type SortDirection = "asc" | "desc" | null;
type SortField = "order_number" | "offer_number" | "units" | "price_euros";

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

  // Filters
  const [filterOrderNumber, setFilterOrderNumber] = useState("");
  const [filterOfferNumber, setFilterOfferNumber] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="w-4 h-4 ml-1" />;
    }
    return <ArrowDown className="w-4 h-4 ml-1" />;
  };

  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // Apply filters
    if (filterOrderNumber) {
      result = result.filter((order) =>
        order.order_number.toLowerCase().includes(filterOrderNumber.toLowerCase())
      );
    }
    if (filterOfferNumber) {
      result = result.filter((order) =>
        order.offers?.offer_number?.toLowerCase().includes(filterOfferNumber.toLowerCase())
      );
    }
    if (filterDescription) {
      result = result.filter((order) =>
        order.offers?.description?.toLowerCase().includes(filterDescription.toLowerCase())
      );
    }
    if (filterStatus && filterStatus !== "all") {
      result = result.filter((order) => order.status === filterStatus);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "order_number":
            comparison = a.order_number.localeCompare(b.order_number, "es", { numeric: true });
            break;
          case "offer_number":
            const offerA = a.offers?.offer_number || "";
            const offerB = b.offers?.offer_number || "";
            comparison = offerA.localeCompare(offerB, "es", { numeric: true });
            break;
          case "units":
            comparison = a.units - b.units;
            break;
          case "price_euros":
            comparison = a.price_euros - b.price_euros;
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [orders, filterOrderNumber, filterOfferNumber, filterDescription, filterStatus, sortField, sortDirection]);

  const clearFilters = () => {
    setFilterOrderNumber("");
    setFilterOfferNumber("");
    setFilterDescription("");
    setFilterStatus("all");
  };

  const hasActiveFilters = filterOrderNumber || filterOfferNumber || filterDescription || (filterStatus && filterStatus !== "all");

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
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="w-4 h-4" />
              Filtros:
            </div>
            <div className="flex-1 min-w-[150px] max-w-[180px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nº Pedido"
                  value={filterOrderNumber}
                  onChange={(e) => setFilterOrderNumber(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[150px] max-w-[180px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nº Oferta"
                  value={filterOfferNumber}
                  onChange={(e) => setFilterOfferNumber(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[180px] max-w-[250px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Descripción"
                  value={filterDescription}
                  onChange={(e) => setFilterDescription(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <div className="min-w-[150px]">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1">
                <X className="w-4 h-4" />
                Limpiar
              </Button>
            )}
          </div>

          {filteredAndSortedOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {hasActiveFilters ? "No se encontraron pedidos con los filtros aplicados" : "No tienes pedidos registrados"}
              </p>
              {!hasActiveFilters && (
                <p className="text-sm text-muted-foreground mt-1">
                  Aplica a ofertas para generar pedidos
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold hover:bg-transparent"
                        onClick={() => handleSort("order_number")}
                      >
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          Nº Pedido
                          {getSortIcon("order_number")}
                        </div>
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold hover:bg-transparent"
                        onClick={() => handleSort("offer_number")}
                      >
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          Nº Oferta
                          {getSortIcon("offer_number")}
                        </div>
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">Descripción</TableHead>
                    <TableHead className="font-semibold text-center">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold hover:bg-transparent w-full justify-center"
                        onClick={() => handleSort("units")}
                      >
                        <div className="flex items-center gap-2 justify-center">
                          <Package className="w-4 h-4" />
                          Unidades
                          {getSortIcon("units")}
                        </div>
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Clock className="w-4 h-4" />
                        Plazo
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold hover:bg-transparent w-full justify-center"
                        onClick={() => handleSort("price_euros")}
                      >
                        <div className="flex items-center gap-2 justify-center">
                          <Euro className="w-4 h-4" />
                          Precio
                          {getSortIcon("price_euros")}
                        </div>
                      </Button>
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
                  {filteredAndSortedOrders.map((order, index) => (
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
