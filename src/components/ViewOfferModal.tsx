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
import { Loader2, Package, Calendar, FileText, Pencil } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Offer {
  id: string;
  offer_number: string;
  description: string;
  minimum_units: number;
  deadline: string | null;
}

interface OfferApplication {
  id: string;
  units: number;
  term: string;
  price_euros: number;
}

interface ViewOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer;
  onSuccess: () => void;
}

export const ViewOfferModal = ({
  open,
  onOpenChange,
  offer,
  onSuccess,
}: ViewOfferModalProps) => {
  const [application, setApplication] = useState<OfferApplication | null>(null);
  const [units, setUnits] = useState("");
  const [term, setTerm] = useState("");
  const [priceEuros, setPriceEuros] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<{
    units?: string;
    term?: string;
    priceEuros?: string;
  }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchApplication();
    }
  }, [open, offer.id]);

  const fetchApplication = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("offer_applications")
      .select("id, units, term, price_euros")
      .eq("offer_id", offer.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching application:", error);
    } else if (data) {
      setApplication(data);
      setUnits(data.units.toString());
      setTerm(data.term);
      setPriceEuros(data.price_euros.toString());
    }
    setLoading(false);
  };

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

  const handleSave = async () => {
    if (!validateForm() || !application) {
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("offer_applications")
        .update({
          units: parseInt(units, 10),
          term: term.trim(),
          price_euros: parseFloat(priceEuros),
        })
        .eq("id", application.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Aplicación actualizada",
        description: "Los datos se han guardado correctamente.",
      });

      setIsEditing(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error updating application:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la aplicación. Inténtalo de nuevo.",
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
    if (application) {
      setUnits(application.units.toString());
      setTerm(application.term);
      setPriceEuros(application.price_euros.toString());
    }
    setIsEditing(false);
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Oferta {offer.offer_number}</span>
            {!isEditing && !loading && application && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos de tu aplicación" : "Revisa los datos de tu aplicación"}
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

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Cargando datos...
          </div>
        ) : !application ? (
          <div className="py-8 text-center text-muted-foreground">
            No se encontraron datos de la aplicación.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="view-units">Unidades</Label>
              <Input
                id="view-units"
                type="number"
                min="1"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                disabled={!isEditing}
                className={errors.units ? "border-destructive" : ""}
              />
              {errors.units && (
                <p className="text-sm text-destructive">{errors.units}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="view-term">Plazo</Label>
              <Input
                id="view-term"
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                disabled={!isEditing}
                className={errors.term ? "border-destructive" : ""}
              />
              {errors.term && (
                <p className="text-sm text-destructive">{errors.term}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="view-priceEuros">Precio en Euros</Label>
              <Input
                id="view-priceEuros"
                type="number"
                step="0.01"
                min="0.01"
                value={priceEuros}
                onChange={(e) => setPriceEuros(e.target.value)}
                disabled={!isEditing}
                className={errors.priceEuros ? "border-destructive" : ""}
              />
              {errors.priceEuros && (
                <p className="text-sm text-destructive">{errors.priceEuros}</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {isEditing ? (
            <>
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Guardar Cambios
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
