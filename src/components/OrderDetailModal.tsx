import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Calendar, FileText, Pencil, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type OrderStatus = "pendiente" | "confirmado";

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

interface OrderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderWithOffer;
  onSuccess: () => void;
}

export const OrderDetailModal = ({
  open,
  onOpenChange,
  order: initialOrder,
  onSuccess,
}: OrderDetailModalProps) => {
  const [order, setOrder] = useState<OrderWithOffer>(initialOrder);
  const [units, setUnits] = useState(initialOrder.units.toString());
  const [term, setTerm] = useState(initialOrder.term);
  const [priceEuros, setPriceEuros] = useState(initialOrder.price_euros.toString());
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<{
    units?: string;
    term?: string;
    priceEuros?: string;
  }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setOrder(initialOrder);
      setUnits(initialOrder.units.toString());
      setTerm(initialOrder.term);
      setPriceEuros(initialOrder.price_euros.toString());
      setIsEditing(false);
      setHasChanges(false);
      setErrors({});
    }
  }, [open, initialOrder]);

  // Track changes when in confirmed status and editing
  useEffect(() => {
    if (order.status === "confirmado" && isEditing) {
      const unitsChanged = parseInt(units, 10) !== order.units;
      const termChanged = term.trim() !== order.term;
      const priceChanged = parseFloat(priceEuros) !== order.price_euros;
      setHasChanges(unitsChanged || termChanged || priceChanged);
    }
  }, [units, term, priceEuros, order, isEditing]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const unitsNum = parseInt(units, 10);
    if (!units.trim() || isNaN(unitsNum) || unitsNum <= 0) {
      newErrors.units = "Introduce un número válido mayor que 0";
    }

    if (!term.trim()) {
      newErrors.term = "El plazo es obligatorio";
    }

    const priceNum = parseFloat(priceEuros);
    if (!priceEuros.trim() || isNaN(priceNum) || priceNum <= 0) {
      newErrors.priceEuros = "Introduce un precio válido mayor que 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerify = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const unitsValue = parseInt(units, 10);
      const priceValue = parseFloat(priceEuros);
      const termValue = term.trim();
      const verifiedAt = new Date().toISOString();

      // Update the offer_application status
      const { error } = await supabase
        .from("offer_applications")
        .update({
          units: unitsValue,
          term: termValue,
          price_euros: priceValue,
          status: "confirmado",
          verified_at: verifiedAt,
        })
        .eq("id", order.id);

      if (error) {
        throw error;
      }

      // Create a record in order_confirmations
      const { error: confirmationError } = await supabase
        .from("order_confirmations")
        .insert({
          offer_application_id: order.id,
          supplier_id: order.supplier_id,
          offer_id: order.offer_id,
          units: unitsValue,
          term: termValue,
          price_euros: priceValue,
          confirmed_at: verifiedAt,
        });

      if (confirmationError) {
        console.error("Error creating confirmation record:", confirmationError);
        // Don't fail the whole operation, just log the error
      }

      toast({
        title: "Pedido verificado",
        description: "El pedido ha sido confirmado correctamente.",
      });

      setIsEditing(false);
      setHasChanges(false);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error verifying order:", error);
      toast({
        title: "Error",
        description: "No se pudo verificar el pedido. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // If changes were made to a confirmed order, reset to pending
      const newStatus = hasChanges ? "pendiente" : order.status;
      const newVerifiedAt = hasChanges ? null : order.verified_at;

      const { error } = await supabase
        .from("offer_applications")
        .update({
          units: parseInt(units, 10),
          term: term.trim(),
          price_euros: parseFloat(priceEuros),
          status: newStatus,
          verified_at: newVerifiedAt,
        })
        .eq("id", order.id);

      if (error) {
        throw error;
      }

      // Update local order state to reflect changes
      const updatedOrder: OrderWithOffer = {
        ...order,
        units: parseInt(units, 10),
        term: term.trim(),
        price_euros: parseFloat(priceEuros),
        status: newStatus as OrderStatus,
        verified_at: newVerifiedAt,
      };
      setOrder(updatedOrder);

      toast({
        title: hasChanges ? "Pedido modificado" : "Cambios guardados",
        description: hasChanges 
          ? "El pedido requiere verificación nuevamente." 
          : "Los datos se han guardado correctamente.",
      });

      setIsEditing(false);
      setHasChanges(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el pedido. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setErrors({});
    onOpenChange(false);
  };

  const handleCancelEdit = () => {
    // Reset to current order values (not initialOrder, in case order was updated)
    setUnits(order.units.toString());
    setTerm(order.term);
    setPriceEuros(order.price_euros.toString());
    setIsEditing(false);
    setHasChanges(false);
    setErrors({});
  };

  const getStatusBadge = () => {
    if (order.status === "confirmado") {
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
        Pendiente de verificación
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4">
            <span>Pedido {order.order_number}</span>
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            {order.offers?.offer_number && (
              <span className="block mb-1">Oferta relacionada: {order.offers.offer_number}</span>
            )}
            {isEditing 
              ? "Modifica los datos del pedido" 
              : order.status === "pendiente" 
                ? "Verifica los datos antes de confirmar el pedido"
                : "Revisa los datos del pedido confirmado"}
          </DialogDescription>
        </DialogHeader>

        {/* Offer details section */}
        {order.offers && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Condiciones de la Oferta
            </h4>
            <p className="text-sm text-muted-foreground">{order.offers.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Uds. mínimas:</span>
                <span className="font-medium text-foreground">
                  {order.offers.minimum_units.toLocaleString("es-ES")}
                </span>
              </div>
              {order.offers.deadline && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Deadline:</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(order.offers.deadline), "dd MMM yyyy", { locale: es })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order-units">Unidades *</Label>
            <Input
              id="order-units"
              type="number"
              min="1"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              disabled={!isEditing && order.status === "confirmado"}
              className={errors.units ? "border-destructive" : ""}
            />
            {errors.units && (
              <p className="text-sm text-destructive">{errors.units}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-term">Plazo *</Label>
            <Input
              id="order-term"
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              disabled={!isEditing && order.status === "confirmado"}
              className={errors.term ? "border-destructive" : ""}
            />
            {errors.term && (
              <p className="text-sm text-destructive">{errors.term}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-priceEuros">Precio en Euros *</Label>
            <Input
              id="order-priceEuros"
              type="number"
              step="0.01"
              min="0.01"
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value)}
              disabled={!isEditing && order.status === "confirmado"}
              className={errors.priceEuros ? "border-destructive" : ""}
            />
            {errors.priceEuros && (
              <p className="text-sm text-destructive">{errors.priceEuros}</p>
            )}
          </div>

          {hasChanges && order.status === "confirmado" && isEditing && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 inline-block mr-2" />
              Al guardar los cambios, el pedido volverá a estado "Pendiente" y deberá ser verificado nuevamente.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {order.status === "pendiente" && !isEditing ? (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cerrar
              </Button>
              <Button onClick={handleVerify} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Verificar y Confirmar
              </Button>
            </>
          ) : order.status === "confirmado" && !isEditing ? (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cerrar
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </>
          ) : isEditing ? (
            <>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleSaveChanges} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar Cambios
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
