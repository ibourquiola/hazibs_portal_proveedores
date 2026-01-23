import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { ShoppingCart, Hash, Package, Clock, Euro, Calendar, Eye, CheckCircle2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type OrderStatus = "pendiente" | "confirmado";
type SortDirection = "asc" | "desc" | null;
type SortField = "order_number" | "offer_number" | "units" | "price_euros";

const ITEMS_PER_PAGE = 20;

interface OrderWithOffer {
  id: string;
  order_number: string;
  offer_id: string | null;
  supplier_id: string | null;
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
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterOrderNumber, setFilterOrderNumber] = useState("");
  const [filterOfferNumber, setFilterOfferNumber] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("offer_applications")
      .select(`
        id,
        order_number,
        offer_id,
        supplier_id,
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterOrderNumber, filterOfferNumber, filterDescription, filterStatus]);

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

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedOrders, currentPage]);

  const clearFilters = () => {
    setFilterOrderNumber("");
    setFilterOfferNumber("");
    setFilterDescription("");
    setFilterStatus("all");
  };

  const hasActiveFilters = filterOrderNumber || filterOfferNumber || filterDescription || (filterStatus && filterStatus !== "all");

  const handleViewClick = (order: OrderWithOffer) => {
    navigate(`/dashboard/pedidos/${order.id}`);
  };

  const getStatusBadge = (status: OrderStatus) => {
    if (status === "confirmado") {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Confirmado</span>
          <span className="sm:hidden">OK</span>
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
        <AlertCircle className="w-3 h-3 mr-1" />
        <span className="hidden sm:inline">Pendiente</span>
        <span className="sm:hidden">Pend.</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="shadow-card w-full">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Listado de Pedidos
          </CardTitle>
          <CardDescription className="text-sm">Pedidos generados a partir de tus aplicaciones</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-2 sm:gap-4">
                <Skeleton className="h-10 sm:h-12 w-20 sm:w-28" />
                <Skeleton className="h-10 sm:h-12 flex-1" />
                <Skeleton className="h-10 sm:h-12 w-16 sm:w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card w-full">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <ShoppingCart className="w-5 h-5 text-primary" />
          Listado de Pedidos
        </CardTitle>
        <CardDescription className="text-sm">Pedidos generados a partir de tus aplicaciones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground sm:col-span-2 lg:col-span-5">
            <Filter className="w-4 h-4" />
            Filtros:
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nº Pedido"
              value={filterOrderNumber}
              onChange={(e) => setFilterOrderNumber(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nº Oferta"
              value={filterOfferNumber}
              onChange={(e) => setFilterOfferNumber(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Descripción"
              value={filterDescription}
              onChange={(e) => setFilterDescription(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div>
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
          <>
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold whitespace-nowrap">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold hover:bg-transparent"
                        onClick={() => handleSort("order_number")}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Hash className="w-4 h-4 hidden sm:block" />
                          <span className="text-xs sm:text-sm">Nº Pedido</span>
                          {getSortIcon("order_number")}
                        </div>
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold whitespace-nowrap hidden md:table-cell">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold hover:bg-transparent"
                        onClick={() => handleSort("offer_number")}
                      >
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Hash className="w-4 h-4 hidden sm:block" />
                          <span className="text-xs sm:text-sm">Nº Oferta</span>
                          {getSortIcon("offer_number")}
                        </div>
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">
                      <span className="text-xs sm:text-sm">Descripción</span>
                    </TableHead>
                    <TableHead className="font-semibold text-center whitespace-nowrap">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold hover:bg-transparent w-full justify-center"
                        onClick={() => handleSort("units")}
                      >
                        <div className="flex items-center gap-1 sm:gap-2 justify-center">
                          <Package className="w-4 h-4 hidden sm:block" />
                          <span className="text-xs sm:text-sm">Uds.</span>
                          {getSortIcon("units")}
                        </div>
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold text-center whitespace-nowrap hidden xl:table-cell">
                      <div className="flex items-center gap-1 sm:gap-2 justify-center">
                        <Clock className="w-4 h-4 hidden sm:block" />
                        <span className="text-xs sm:text-sm">Plazo</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center whitespace-nowrap">
                      <Button
                        variant="ghost"
                        className="p-0 h-auto font-semibold hover:bg-transparent w-full justify-center"
                        onClick={() => handleSort("price_euros")}
                      >
                        <div className="flex items-center gap-1 sm:gap-2 justify-center">
                          <Euro className="w-4 h-4 hidden sm:block" />
                          <span className="text-xs sm:text-sm">Precio</span>
                          {getSortIcon("price_euros")}
                        </div>
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold text-center whitespace-nowrap">
                      <span className="text-xs sm:text-sm">Estado</span>
                    </TableHead>
                    <TableHead className="font-semibold text-center whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center gap-1 sm:gap-2 justify-center">
                        <Calendar className="w-4 h-4 hidden sm:block" />
                        <span className="text-xs sm:text-sm">Fecha</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-center whitespace-nowrap">
                      <span className="text-xs sm:text-sm">Acción</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order, index) => (
                    <TableRow
                      key={order.id}
                      className="animate-fade-in hover:bg-accent/50 transition-colors cursor-pointer"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => handleViewClick(order)}
                    >
                      <TableCell className="font-mono font-medium text-primary text-xs sm:text-sm whitespace-nowrap">
                        {order.order_number}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground text-xs sm:text-sm hidden md:table-cell whitespace-nowrap">
                        {order.offers?.offer_number || "-"}
                      </TableCell>
                      <TableCell className="max-w-[150px] hidden lg:table-cell">
                        <p className="truncate text-xs sm:text-sm">{order.offers?.description || "-"}</p>
                      </TableCell>
                      <TableCell className="text-center font-medium text-xs sm:text-sm">
                        {order.units.toLocaleString("es-ES")}
                      </TableCell>
                      <TableCell className="text-center text-xs sm:text-sm hidden xl:table-cell">{order.term}</TableCell>
                      <TableCell className="text-center font-medium text-xs sm:text-sm whitespace-nowrap">
                        {order.price_euros.toLocaleString("es-ES", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-center text-xs sm:text-sm hidden sm:table-cell whitespace-nowrap">
                        {format(new Date(order.created_at), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 sm:gap-2 text-xs sm:text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewClick(order);
                          }}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Ver detalle</span>
                          <span className="sm:hidden">Ver</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
                <p className="text-sm text-muted-foreground order-2 sm:order-1">
                  Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedOrders.length)} de {filteredAndSortedOrders.length} pedidos
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Anterior</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <span className="hidden sm:inline mr-1">Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Pedidos;
