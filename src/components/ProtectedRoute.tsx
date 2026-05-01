import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/lib/api";
import { dashboardPath } from "@/lib/api";

export const ProtectedRoute = ({ allow, children }: { allow: Role; children: React.ReactNode }) => {
  const { token, role } = useAuth();
  if (!token || !role) return <Navigate to="/login" replace />;
  if (role !== allow) return <Navigate to={dashboardPath(role)} replace />;
  return <>{children}</>;
};
