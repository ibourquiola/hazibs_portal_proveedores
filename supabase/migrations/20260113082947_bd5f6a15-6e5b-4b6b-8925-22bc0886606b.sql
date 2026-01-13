-- Create enum for offer status
CREATE TYPE public.offer_status AS ENUM ('abierta', 'aplicada', 'aceptada', 'rechazada');

-- Create offers table
CREATE TABLE public.offers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_number VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    minimum_units INTEGER NOT NULL DEFAULT 1,
    status offer_status NOT NULL DEFAULT 'abierta',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read offers
CREATE POLICY "Authenticated users can view offers" 
ON public.offers 
FOR SELECT 
TO authenticated
USING (true);

-- Create policy for authenticated users to update offer status (apply to offers)
CREATE POLICY "Authenticated users can update offers" 
ON public.offers 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.offers (offer_number, description, minimum_units, status) VALUES
('OF-2024-001', 'Suministro de material de oficina premium', 100, 'abierta'),
('OF-2024-002', 'Equipos informáticos para centro de datos', 50, 'abierta'),
('OF-2024-003', 'Mobiliario ergonómico de oficina', 25, 'aplicada'),
('OF-2024-004', 'Servicios de limpieza industrial', 1, 'aceptada'),
('OF-2024-005', 'Consumibles de impresión', 200, 'rechazada'),
('OF-2024-006', 'Material de embalaje ecológico', 500, 'abierta'),
('OF-2024-007', 'Equipos de protección individual', 150, 'aplicada'),
('OF-2024-008', 'Servicios de mantenimiento técnico', 1, 'abierta');