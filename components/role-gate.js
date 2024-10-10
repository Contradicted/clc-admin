"use client";

import { useCurrentRole } from "@/hooks/useCurrentRole";
import { useToast } from "./ui/use-toast";
import { redirect } from "next/navigation";

export const RoleGate = ({ children, allowedRoles, redirectTo }) => {
  const currentRole = useCurrentRole();

  if (!allowedRoles.includes(currentRole)) {
    return redirect(redirectTo);
  }

  return <>{children}</>;
};
