import { useEffect, useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send, FileText, Package, Calendar, Euro, Hash, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

interface LineInput {
  confirmed_units: string;
  confirmed_price: string;
  confirmed_term: Date | undefined;
}

const OfferDetail = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [offer, setOffer] = useState<Offer | null>(null);
  const [lines, setLines] = useState<OfferLine[]>([]);
  const [lineInputs, setLineInputs] = useState<Record<string, LineInput>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, { units?: string; price?: string }>>({});

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
      navigate("/dashboard/ofertas");
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
      // Initialize inputs
      const inputs: Record<string, LineInput> = {};
      (linesData || []).forEach((line: any) => {
        inputs[line.id] = {
          confirmed_units: line.confirmed_units?.toString() || "",
          confirmed_price: line.confirmed_price?.toString() || "",
          confirmed_term: line.confirmed_term ? new Date(line.confirmed_term) : undefined,
        };
      });
      setLineInputs(inputs);
    }

    setLoading(false);
  };

  const isReadOnly = offer?.status === "aceptada" || offer?.status === "rechazada";

  const handleInputChange = (lineId: string, field: "confirmed_units" | "confirmed_price", value: string) => {
    setLineInputs((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        [field]: value,
      },
    }));
    // Clear error for this field
    setErrors((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        [field === "confirmed_units" ? "units" : "price"]: undefined,
      },
    }));
  };

  const validateLine = (lineId: string): boolean => {
    const input = lineInputs[lineId];
    const newErrors: { units?: string; price?: string } = {};

    if (input.confirmed_units) {
      const units = parseFloat(input.confirmed_units);
      if (isNaN(units) || units <= 0) {
        newErrors.units = "Debe ser un número positivo";
      }
    }

    if (input.confirmed_price) {
      const price = parseFloat(input.confirmed_price);
      if (isNaN(price) || price <= 0) {
        newErrors.price = "Debe ser un número positivo";
      }
    }

    setErrors((prev) => ({ ...prev, [lineId]: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateAllForSend = (): boolean => {
    let isValid = true;
    const newErrors: Record<string, { units?: string; price?: string }> = {};

    lines.forEach((line) => {
      const input = lineInputs[line.id];
      const lineErrors: { units?: string; price?: string } = {};

      if (!input.confirmed_units || input.confirmed_units.trim() === "") {
        lineErrors.units = "Requerido";
        isValid = false;
      } else {
        const units = parseFloat(input.confirmed_units);
        if (isNaN(units) || units <= 0) {
          lineErrors.units = "Debe ser un número positivo";
          isValid = false;
        }
      }

      if (!input.confirmed_price || input.confirmed_price.trim() === "") {
        lineErrors.price = "Requerido";
        isValid = false;
      } else {
        const price = parseFloat(input.confirmed_price);
        if (isNaN(price) || price <= 0) {
          lineErrors.price = "Debe ser un número positivo";
          isValid = false;
        }
      }

      if (Object.keys(lineErrors).length > 0) {
        newErrors[line.id] = lineErrors;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const canSend = (): boolean => {
    return lines.every((line) => {
      const input = lineInputs[line.id];
      if (!input) return false;
      const units = parseFloat(input.confirmed_units);
      const price = parseFloat(input.confirmed_price);
      return !isNaN(units) && units > 0 && !isNaN(price) && price > 0;
    });
  };

  const handleSave = async () => {
    // Validate all lines that have input
    let hasErrors = false;
    lines.forEach((line) => {
      if (!validateLine(line.id)) {
        hasErrors = true;
      }
    });

    if (hasErrors) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Corrige los errores antes de guardar.",
      });
      return;
    }

    setSaving(true);

    try {
      // Update each line
      for (const line of lines) {
        const input = lineInputs[line.id];
        const confirmed_units = input.confirmed_units ? parseFloat(input.confirmed_units) : null;
        const confirmed_price = input.confirmed_price ? parseFloat(input.confirmed_price) : null;
        const confirmed_term = input.confirmed_term ? format(input.confirmed_term, "yyyy-MM-dd") : null;

        await supabase
          .from("offer_lines")
          .update({
            confirmed_units,
            confirmed_price,
            confirmed_term,
          } as any)
          .eq("id", line.id);
      }

      toast({
        title: "Guardado",
        description: "Los cambios se han guardado correctamente.",
      });

      fetchOfferData();
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar los cambios.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!validateAllForSend()) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Todos los campos deben estar completados correctamente.",
      });
      return;
    }

    setSending(true);

    try {
      // Save all lines first
      for (const line of lines) {
        const input = lineInputs[line.id];
        const confirmed_units = parseFloat(input.confirmed_units);
        const confirmed_price = parseFloat(input.confirmed_price);
        const confirmed_term = input.confirmed_term ? format(input.confirmed_term, "yyyy-MM-dd") : null;

        await supabase
          .from("offer_lines")
          .update({
            confirmed_units,
            confirmed_price,
            confirmed_term,
          } as any)
          .eq("id", line.id);
      }

      // Update offer status to "aplicada"
      await supabase
        .from("offers")
        .update({ status: "aplicada" })
        .eq("id", offerId);

      toast({
        title: "Oferta enviada",
        description: "La oferta se ha enviado correctamente.",
      });

      navigate("/dashboard/ofertas");
    } catch (error) {
      console.error("Error sending:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la oferta.",
      });
    } finally {
      setSending(false);
      setShowSendConfirm(false);
    }
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
      <Button variant="ghost" onClick={() => navigate("/dashboard/ofertas")} className="gap-2">
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
            {offer.deadline && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Fecha límite: {format(new Date(offer.deadline), "dd MMM yyyy", { locale: es })}</span>
              </div>
            )}
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
                    <TableHead className="text-center whitespace-nowrap bg-primary/5">
                      Plazo
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
                        {line.reference_price
                          ? line.reference_price.toLocaleString("es-ES", {
                              style: "currency",
                              currency: "EUR",
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="bg-primary/5">
                        <div className="space-y-1">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={lineInputs[line.id]?.confirmed_units || ""}
                            onChange={(e) => handleInputChange(line.id, "confirmed_units", e.target.value)}
                            disabled={isReadOnly}
                            className={`w-28 text-right ${errors[line.id]?.units ? "border-destructive" : ""}`}
                          />
                          {errors[line.id]?.units && (
                            <p className="text-xs text-destructive">{errors[line.id].units}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="bg-primary/5">
                        <div className="space-y-1">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={lineInputs[line.id]?.confirmed_price || ""}
                            onChange={(e) => handleInputChange(line.id, "confirmed_price", e.target.value)}
                            disabled={isReadOnly}
                            className={`w-28 text-right ${errors[line.id]?.price ? "border-destructive" : ""}`}
                          />
                          {errors[line.id]?.price && (
                            <p className="text-xs text-destructive">{errors[line.id].price}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="bg-primary/5">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              disabled={isReadOnly}
                              className={cn(
                                "w-36 justify-start text-left font-normal",
                                !lineInputs[line.id]?.confirmed_term && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {lineInputs[line.id]?.confirmed_term
                                ? format(lineInputs[line.id].confirmed_term!, "dd/MM/yyyy")
                                : "Seleccionar"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={lineInputs[line.id]?.confirmed_term}
                              onSelect={(date) =>
                                setLineInputs((prev) => ({
                                  ...prev,
                                  [line.id]: { ...prev[line.id], confirmed_term: date },
                                }))
                              }
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!isReadOnly && lines.length > 0 && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving || sending}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
          <Button
            onClick={() => setShowSendConfirm(true)}
            disabled={!canSend() || saving || sending}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            {sending ? "Enviando..." : "Enviar oferta"}
          </Button>
        </div>
      )}

      {/* Send Confirmation Dialog */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Enviar oferta?</AlertDialogTitle>
            <AlertDialogDescription>
              Una vez enviada, la oferta quedará registrada y podrás editarla posteriormente si es necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend} disabled={sending}>
              {sending ? "Enviando..." : "Enviar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OfferDetail;
