import { createContext, useContext, useEffect, useState } from "react";
import { getRole, getToken, setRole as persistRole, setToken as persistToken, type Role } from "@/lib/api";

interface AuthCtx {
  token: string | null;
  role: Role | null;
  login: (token: string, role: Role) => void;
  logout: () => void;
}
const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(getToken());
  const [role, setRole] = useState<Role | null>(getRole());

  useEffect(() => {
    const onStorage = () => {
      setToken(getToken());
      setRole(getRole());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <Ctx.Provider
      value={{
        token,
        role,
        login: (t, r) => { persistToken(t); persistRole(r); setToken(t); setRole(r); },
        logout: () => { persistToken(null); persistRole(null); setToken(null); setRole(null); },
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
