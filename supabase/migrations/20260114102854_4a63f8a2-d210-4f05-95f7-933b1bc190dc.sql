-- 1. Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'supplier');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 6. RLS policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Create suppliers table (sin policy que referencie supplier_users todavía)
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    family TEXT NOT NULL,
    average_billing NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Admin policy for suppliers
CREATE POLICY "Admins can manage suppliers"
ON public.suppliers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Create supplier_users table
CREATE TABLE public.supplier_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    position TEXT,
    email TEXT NOT NULL,
    invitation_token UUID DEFAULT gen_random_uuid(),
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    invitation_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.supplier_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for supplier_users
CREATE POLICY "Admins can manage supplier users"
ON public.supplier_users
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supplier users can view their own record"
ON public.supplier_users
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Supplier users can view colleagues"
ON public.supplier_users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_users su
    WHERE su.user_id = auth.uid()
    AND su.supplier_id = supplier_users.supplier_id
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_supplier_users_updated_at
BEFORE UPDATE ON public.supplier_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Now add suppliers policy that references supplier_users
CREATE POLICY "Suppliers can view their own supplier"
ON public.suppliers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.supplier_users
    WHERE supplier_users.supplier_id = suppliers.id
    AND supplier_users.user_id = auth.uid()
  )
);

-- 10. Update offer_applications to link to supplier
ALTER TABLE public.offer_applications 
ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id);

-- 11. Assign admin role to existing admin user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@kuik.tech'
ON CONFLICT DO NOTHING;

-- 12. Create function to get supplier_id for a user
CREATE OR REPLACE FUNCTION public.get_user_supplier_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT supplier_id
  FROM public.supplier_users
  WHERE user_id = _user_id
  LIMIT 1
$$;