"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { getProfileByAuthId } from "@/feature/auth/queries/auth.queries";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const session = await authClient.getSession();
      if (!session?.data?.user) return null;
      const user = session.data.user;

      return getProfileByAuthId(user.id, user.email, user.name);
    },
  });
}
