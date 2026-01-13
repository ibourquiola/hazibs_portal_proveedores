import { useState } from "react";
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
import { Loader2, Package, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Offer {
  id: string;
  offer_number: string;
  description: string;
  minimum_units: number;
  deadline: string | null;
}

interface ApplyOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer;
  onSuccess: () => void;
}

export const ApplyOfferModal = ({
  open,
  onOpenChange,
  offer,
  onSuccess,
}: ApplyOfferModalProps) => {
  const [units, setUnits] = useState("");
  const [term, setTerm] = useState("");
  const [priceEuros, setPriceEuros] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    units?: string;
    term?: string;
    priceEuros?: string;
  }>({});
  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para aplicar a una oferta.",
          variant: "destructive",
        });
        return;
      }

      const { error: insertError } = await supabase.from("offer_applications").insert({
        offer_id: offer.id,
        user_id: user.id,
        units: parseInt(units, 10),
        term: term.trim(),
        price_euros: parseFloat(priceEuros),
      });

      if (insertError) {
        throw insertError;
      }

      // Update offer status to "aplicada"
      const { error: updateError } = await supabase
        .from("offers")
        .update({ status: "aplicada" })
        .eq("id", offer.id);

      if (updateError) {
        console.error("Error updating offer status:", updateError);
      }

      // Send email notification
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        await fetch(`${supabaseUrl}/functions/v1/send-order-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userEmail: user.email,
            offerNumber: offer.offer_number,
            offerDescription: offer.description,
            units: parseInt(units, 10),
            term: term.trim(),
            priceEuros: parseFloat(priceEuros),
          }),
        });
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Don't fail the whole operation if email fails
      }

      toast({
        title: "Aplicación enviada",
        description: `Has aplicado correctamente a la oferta ${offer.offer_number}.`,
      });

      // Reset form and close
      setUnits("");
      setTerm("");
      setPriceEuros("");
      setErrors({});
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error applying to offer:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la aplicación. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUnits("");
    setTerm("");
    setPriceEuros("");
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Aplicar a Oferta {offer.offer_number}</DialogTitle>
          <DialogDescription>
            Revisa las condiciones y completa tu propuesta
          </DialogDescription>
        </DialogHeader>

        {/* Offer details section */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Condiciones de la Oferta
          </h4>
          <p className="text-sm text-muted-foreground">{offer.description}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Uds. mínimas:</span>
              <span className="font-medium text-foreground">
                {offer.minimum_units.toLocaleString("es-ES")}
              </span>
            </div>
            {offer.deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Deadline:</span>
                <span className="font-medium text-foreground">
                  {format(new Date(offer.deadline), "dd MMM yyyy", { locale: es })}
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="units">Unidades *</Label>
            <Input
              id="units"
              type="number"
              min="1"
              placeholder="Ej: 100"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className={errors.units ? "border-destructive" : ""}
            />
            {errors.units && (
              <p className="text-sm text-destructive">{errors.units}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">Plazo *</Label>
            <Input
              id="term"
              type="text"
              placeholder="Ej: 2 semanas"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className={errors.term ? "border-destructive" : ""}
            />
            {errors.term && (
              <p className="text-sm text-destructive">{errors.term}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceEuros">Precio en Euros *</Label>
            <Input
              id="priceEuros"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ej: 150.00"
              value={priceEuros}
              onChange={(e) => setPriceEuros(e.target.value)}
              className={errors.priceEuros ? "border-destructive" : ""}
            />
            {errors.priceEuros && (
              <p className="text-sm text-destructive">{errors.priceEuros}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar Aplicación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
