import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "supplier" | null;

interface UseUserRoleReturn {
  user: User | null;
  role: AppRole;
  loading: boolean;
  supplierId: string | null;
}

export const useUserRole = (): UseUserRoleReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async (userId: string) => {
      try {
        // Fetch role using the security definer function
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_user_role', { _user_id: userId });

        if (roleError) {
          console.error("Error fetching role:", roleError);
          setRole(null);
        } else {
          setRole(roleData as AppRole);
        }

        // If supplier, fetch supplier_id
        if (roleData === 'supplier') {
          const { data: supplierData, error: supplierError } = await supabase
            .rpc('get_user_supplier_id', { _user_id: userId });

          if (!supplierError && supplierData) {
            setSupplierId(supplierData);
          }
        }
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
        setRole(null);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchUserRole(session.user.id);
        } else {
          setUser(null);
          setRole(null);
          setSupplierId(null);
        }
        setLoading(false);
      }
    );

    // Initial fetch
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, role, loading, supplierId };
};
