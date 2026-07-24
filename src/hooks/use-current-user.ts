import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  department: string;
  isAdmin: boolean;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async (): Promise<CurrentUser | null> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("full_name, department").eq("id", userData.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userData.user.id),
      ]);
      return {
        id: userData.user.id,
        email: userData.user.email ?? "",
        fullName: profile?.full_name ?? userData.user.email?.split("@")[0] ?? "",
        department: profile?.department ?? "General",
        isAdmin: !!roles?.some((r) => r.role === "admin"),
      };
    },
  });
}
