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
import { Loader2 } from "lucide-react";

interface ApplyOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: string;
  offerNumber: string;
  onSuccess: () => void;
}

export const ApplyOfferModal = ({
  open,
  onOpenChange,
  offerId,
  offerNumber,
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

      const { error } = await supabase.from("offer_applications").insert({
        offer_id: offerId,
        user_id: user.id,
        units: parseInt(units, 10),
        term: term.trim(),
        price_euros: parseFloat(priceEuros),
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Aplicación enviada",
        description: `Has aplicado correctamente a la oferta ${offerNumber}.`,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aplicar a Oferta</DialogTitle>
          <DialogDescription>
            Completa los datos para aplicar a la oferta <strong>{offerNumber}</strong>
          </DialogDescription>
        </DialogHeader>
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
