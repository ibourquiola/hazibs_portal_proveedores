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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FileText, Package, Hash, Calendar as CalendarIcon, Send, Eye, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ApplyOfferModal } from "@/components/ApplyOfferModal";
import { ViewOfferModal } from "@/components/ViewOfferModal";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type OfferStatus = "abierta" | "aplicada" | "aceptada" | "rechazada";
type SortDirection = "asc" | "desc" | null;
type SortField = "offer_number" | "minimum_units" | "deadline";

const ITEMS_PER_PAGE = 20;

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
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Filters
  const [filterOfferNumber, setFilterOfferNumber] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [filterDeadline, setFilterDeadline] = useState<Date | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterOfferNumber, filterDescription, filterDeadline, filterStatus]);

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

  const filteredAndSortedOffers = useMemo(() => {
    let result = [...offers];

    // Apply filters
    if (filterOfferNumber) {
      result = result.filter((offer) =>
        offer.offer_number.toLowerCase().includes(filterOfferNumber.toLowerCase())
      );
    }
    if (filterDescription) {
      result = result.filter((offer) =>
        offer.description.toLowerCase().includes(filterDescription.toLowerCase())
      );
    }
    if (filterDeadline) {
      result = result.filter((offer) => {
        if (!offer.deadline) return false;
        return new Date(offer.deadline) <= filterDeadline;
      });
    }
    if (filterStatus && filterStatus !== "all") {
      result = result.filter((offer) => offer.status === filterStatus);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "offer_number":
            comparison = a.offer_number.localeCompare(b.offer_number, "es", { numeric: true });
            break;
          case "minimum_units":
            comparison = a.minimum_units - b.minimum_units;
            break;
          case "deadline":
            const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
            const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
            comparison = dateA - dateB;
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [offers, filterOfferNumber, filterDescription, filterDeadline, filterStatus, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedOffers.length / ITEMS_PER_PAGE);
  const paginatedOffers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedOffers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedOffers, currentPage]);

  const clearFilters = () => {
    setFilterOfferNumber("");
    setFilterDescription("");
    setFilterDeadline(undefined);
    setFilterStatus("all");
  };

  const hasActiveFilters = filterOfferNumber || filterDescription || filterDeadline || (filterStatus && filterStatus !== "all");

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
    setApplyModalOpen(true);
  };

  const handleViewClick = (offer: Offer) => {
    setSelectedOffer(offer);
    setViewModalOpen(true);
  };

  const handleSuccess = () => {
    fetchOffers();
  };

  const renderActionButton = (offer: Offer) => {
    switch (offer.status) {
      case "abierta":
        return (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 sm:gap-2 text-xs sm:text-sm"
            onClick={() => handleApplyClick(offer)}
          >
            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Aplicar oferta</span>
            <span className="sm:hidden">Aplicar</span>
          </Button>
        );
      case "aplicada":
        return (
          <Button
            size="sm"
            variant="outline"
            className="gap-1 sm:gap-2 text-xs sm:text-sm"
            onClick={() => handleViewClick(offer)}
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Ver oferta</span>
            <span className="sm:hidden">Ver</span>
          </Button>
        );
      case "aceptada":
      case "rechazada":
        return (
          <span className="text-sm text-muted-foreground">—</span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="shadow-card w-full">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="w-5 h-5 text-primary" />
            Listado de Ofertas
          </CardTitle>
          <CardDescription className="text-sm">Consulta y gestiona las ofertas disponibles</CardDescription>
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
    <>
      <Card className="shadow-card w-full">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="w-5 h-5 text-primary" />
            Listado de Ofertas
          </CardTitle>
          <CardDescription className="text-sm">Consulta y gestiona las ofertas disponibles</CardDescription>
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9",
                      !filterDeadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterDeadline ? format(filterDeadline, "dd MMM yyyy", { locale: es }) : "Deadline hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterDeadline}
                    onSelect={setFilterDeadline}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="abierta">Abierta</SelectItem>
                  <SelectItem value="aplicada">Aplicada</SelectItem>
                  <SelectItem value="aceptada">Aceptada</SelectItem>
                  <SelectItem value="rechazada">Rechazada</SelectItem>
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

          {filteredAndSortedOffers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {hasActiveFilters ? "No se encontraron ofertas con los filtros aplicados" : "No hay ofertas disponibles"}
              </p>
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
                          onClick={() => handleSort("offer_number")}
                        >
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Hash className="w-4 h-4 hidden sm:block" />
                            <span className="text-xs sm:text-sm">Nº Oferta</span>
                            {getSortIcon("offer_number")}
                          </div>
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <FileText className="w-4 h-4 hidden sm:block" />
                          <span className="text-xs sm:text-sm">Descripción</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-center whitespace-nowrap hidden md:table-cell">
                        <Button
                          variant="ghost"
                          className="p-0 h-auto font-semibold hover:bg-transparent w-full justify-center"
                          onClick={() => handleSort("minimum_units")}
                        >
                          <div className="flex items-center gap-1 sm:gap-2 justify-center">
                            <Package className="w-4 h-4 hidden sm:block" />
                            <span className="text-xs sm:text-sm">Uds. Mín.</span>
                            {getSortIcon("minimum_units")}
                          </div>
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-center whitespace-nowrap hidden lg:table-cell">
                        <Button
                          variant="ghost"
                          className="p-0 h-auto font-semibold hover:bg-transparent w-full justify-center"
                          onClick={() => handleSort("deadline")}
                        >
                          <div className="flex items-center gap-1 sm:gap-2 justify-center">
                            <CalendarIcon className="w-4 h-4 hidden sm:block" />
                            <span className="text-xs sm:text-sm">Deadline</span>
                            {getSortIcon("deadline")}
                          </div>
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-center whitespace-nowrap">
                        <span className="text-xs sm:text-sm">Estado</span>
                      </TableHead>
                      <TableHead className="font-semibold text-center whitespace-nowrap">
                        <span className="text-xs sm:text-sm">Acción</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOffers.map((offer, index) => (
                      <TableRow
                        key={offer.id}
                        className="animate-fade-in hover:bg-accent/50 transition-colors"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell className="font-mono font-medium text-primary text-xs sm:text-sm whitespace-nowrap">
                          {offer.offer_number}
                        </TableCell>
                        <TableCell className="max-w-[120px] sm:max-w-md">
                          <p className="truncate text-xs sm:text-sm">{offer.description}</p>
                        </TableCell>
                        <TableCell className="text-center font-medium text-xs sm:text-sm hidden md:table-cell">
                          {offer.minimum_units.toLocaleString("es-ES")}
                        </TableCell>
                        <TableCell className="text-center text-xs sm:text-sm hidden lg:table-cell whitespace-nowrap">
                          {offer.deadline
                            ? format(new Date(offer.deadline), "dd MMM yyyy", { locale: es })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(offer.status)}
                        </TableCell>
                        <TableCell className="text-center">
                          {renderActionButton(offer)}
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
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedOffers.length)} de {filteredAndSortedOffers.length} ofertas
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

      {selectedOffer && (
        <>
          <ApplyOfferModal
            open={applyModalOpen}
            onOpenChange={setApplyModalOpen}
            offer={selectedOffer}
            onSuccess={handleSuccess}
          />
          <ViewOfferModal
            open={viewModalOpen}
            onOpenChange={setViewModalOpen}
            offer={selectedOffer}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </>
  );
};

export default Ofertas;