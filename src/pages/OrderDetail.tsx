import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  ShoppingCart, 
  Package, 
  Calendar, 
  Euro, 
  Hash, 
  Plus, 
  Trash2, 
  Search,
  AlertCircle,
  Copy
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

interface LocalConfirmation {
  tempId: string;
  order_line_id: string;
  article_code: string;
  confirmed_units: string;
  confirmed_term: string;
  confirmed_price: string;
  isNew: boolean;
  dbId?: string;
}

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const [confirmations, setConfirmations] = useState<LocalConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterCode, setFilterCode] = useState("");
  const [showConfirmAllDialog, setShowConfirmAllDialog] = useState(false);

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
      navigate("/dashboard/pedidos");
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
      // Convert to local format
      const localConfirms: LocalConfirmation[] = (confirmationsData || []).map((c: LineConfirmation) => ({
        tempId: c.id,
        order_line_id: c.order_line_id,
        article_code: c.article_code,
        confirmed_units: c.confirmed_units.toString(),
        confirmed_term: c.confirmed_term,
        confirmed_price: c.confirmed_price.toString(),
        isNew: false,
        dbId: c.id,
      }));
      setConfirmations(localConfirms);
    }

    setLoading(false);
  };

  const isReadOnly = order?.status === "confirmado";

  // Calculate confirmed units per article
  const confirmedUnitsPerArticle = useMemo(() => {
    const result: Record<string, number> = {};
    confirmations.forEach((c) => {
      const units = parseFloat(c.confirmed_units) || 0;
      result[c.article_code] = (result[c.article_code] || 0) + units;
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

  const handleAddConfirmation = (articleCode: string) => {
    const orderLine = orderLines.find((l) => l.article_code === articleCode);
    if (!orderLine) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El código de artículo no existe en el pedido.",
      });
      return;
    }

    const newConfirmation: LocalConfirmation = {
      tempId: `new-${Date.now()}-${Math.random()}`,
      order_line_id: orderLine.id,
      article_code: articleCode,
      confirmed_units: "",
      confirmed_term: "",
      confirmed_price: "",
      isNew: true,
    };

    setConfirmations((prev) => [...prev, newConfirmation]);
  };

  const handleConfirmationChange = (
    tempId: string,
    field: "confirmed_units" | "confirmed_term" | "confirmed_price",
    value: string
  ) => {
    setConfirmations((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, [field]: value } : c))
    );
  };

  const handleDeleteConfirmation = (tempId: string) => {
    setConfirmations((prev) => prev.filter((c) => c.tempId !== tempId));
  };

  const handleConfirmAll = () => {
    const newConfirmations: LocalConfirmation[] = orderLines.map((line) => ({
      tempId: `new-${Date.now()}-${Math.random()}-${line.id}`,
      order_line_id: line.id,
      article_code: line.article_code,
      confirmed_units: line.requested_units.toString(),
      confirmed_term: line.requested_term || format(new Date(), "yyyy-MM-dd"),
      confirmed_price: (line.requested_price || 0).toString(),
      isNew: true,
    }));

    setConfirmations(newConfirmations);
    setShowConfirmAllDialog(false);

    toast({
      title: "Líneas añadidas",
      description: "Se han copiado todas las líneas del pedido.",
    });
  };

  const validateConfirmations = (): boolean => {
    // Check all confirmations have required fields
    for (const c of confirmations) {
      const units = parseFloat(c.confirmed_units);
      const price = parseFloat(c.confirmed_price);

      if (!c.confirmed_units || isNaN(units) || units <= 0) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: `Las unidades confirmadas para ${c.article_code} deben ser un número positivo.`,
        });
        return false;
      }

      if (!c.confirmed_term) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: `Falta el plazo confirmado para ${c.article_code}.`,
        });
        return false;
      }

      if (!c.confirmed_price || isNaN(price) || price <= 0) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: `El precio confirmado para ${c.article_code} debe ser un número positivo.`,
        });
        return false;
      }
    }

    // Validate units don't exceed requested
    for (const articleCode of Object.keys(confirmedUnitsPerArticle)) {
      const confirmed = confirmedUnitsPerArticle[articleCode];
      const requested = requestedUnitsPerArticle[articleCode];
      if (confirmed > requested) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: `Las unidades confirmadas para ${articleCode} (${confirmed}) superan las solicitadas (${requested}).`,
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateConfirmations()) return;

    setSaving(true);

    try {
      // Delete existing confirmations that were removed
      const existingIds = confirmations.filter((c) => !c.isNew).map((c) => c.dbId);
      const { data: currentConfirms } = await supabase
        .from("order_line_confirmations")
        .select("id")
        .eq("offer_application_id", orderId);

      const toDelete = (currentConfirms || [])
        .filter((c: { id: string }) => !existingIds.includes(c.id))
        .map((c: { id: string }) => c.id);

      if (toDelete.length > 0) {
        await supabase
          .from("order_line_confirmations")
          .delete()
          .in("id", toDelete);
      }

      // Update existing confirmations
      for (const c of confirmations.filter((c) => !c.isNew)) {
        await supabase
          .from("order_line_confirmations")
          .update({
            confirmed_units: parseFloat(c.confirmed_units),
            confirmed_term: c.confirmed_term,
            confirmed_price: parseFloat(c.confirmed_price),
          })
          .eq("id", c.dbId);
      }

      // Insert new confirmations
      const newConfirms = confirmations
        .filter((c) => c.isNew)
        .map((c) => ({
          order_line_id: c.order_line_id,
          offer_application_id: orderId,
          article_code: c.article_code,
          confirmed_units: parseFloat(c.confirmed_units),
          confirmed_term: c.confirmed_term,
          confirmed_price: parseFloat(c.confirmed_price),
        }));

      if (newConfirms.length > 0) {
        await supabase.from("order_line_confirmations").insert(newConfirms);
      }

      toast({
        title: "Guardado",
        description: "Las confirmaciones se han guardado correctamente.",
      });

      fetchOrderData();
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar las confirmaciones.",
      });
    } finally {
      setSaving(false);
    }
  };

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
      <Button variant="ghost" onClick={() => navigate("/dashboard/pedidos")} className="gap-2">
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
                    {!isReadOnly && <TableHead className="text-center">Acción</TableHead>}
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
                          {line.requested_price
                            ? line.requested_price.toLocaleString("es-ES", {
                                style: "currency",
                                currency: "EUR",
                              })
                            : "-"}
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
                        {!isReadOnly && (
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddConfirmation(line.article_code)}
                              disabled={isAtLimit}
                              className="gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Añadir
                            </Button>
                          </TableCell>
                        )}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Confirmaciones del proveedor
            </CardTitle>
            {!isReadOnly && orderLines.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowConfirmAllDialog(true)}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Confirmar todo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {confirmations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay confirmaciones todavía</p>
              {!isReadOnly && (
                <p className="text-sm mt-1">
                  Añade líneas desde la tabla superior o usa "Confirmar todo"
                </p>
              )}
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
                    {!isReadOnly && <TableHead className="text-center">Acción</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmations.map((conf) => (
                    <TableRow key={conf.tempId}>
                      <TableCell className="font-mono font-medium">
                        {conf.article_code}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="0"
                          value={conf.confirmed_units}
                          onChange={(e) =>
                            handleConfirmationChange(conf.tempId, "confirmed_units", e.target.value)
                          }
                          disabled={isReadOnly}
                          className="w-28 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={conf.confirmed_term}
                          onChange={(e) =>
                            handleConfirmationChange(conf.tempId, "confirmed_term", e.target.value)
                          }
                          disabled={isReadOnly}
                          className="w-40"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0.00"
                          value={conf.confirmed_price}
                          onChange={(e) =>
                            handleConfirmationChange(conf.tempId, "confirmed_price", e.target.value)
                          }
                          disabled={isReadOnly}
                          className="w-32 text-right"
                        />
                      </TableCell>
                      {!isReadOnly && (
                        <TableCell className="text-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteConfirmation(conf.tempId)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="flex justify-end gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || confirmations.length === 0}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : "Guardar confirmación"}
          </Button>
        </div>
      )}

      {/* Confirm All Dialog */}
      <AlertDialog open={showConfirmAllDialog} onOpenChange={setShowConfirmAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar todas las líneas?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción copiará todas las líneas del pedido con las mismas unidades, plazos y precios solicitados. 
              Se eliminarán las confirmaciones actuales.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAll}>
              Confirmar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderDetail;
