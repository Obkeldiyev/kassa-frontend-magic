import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import Admins from "./pages/super-admin/Admins";
import { CashiersPage } from "./components/CashiersPage";
import { PaymentsPage } from "./components/PaymentsPage";
import { ProfilePage } from "./components/ProfilePage";

import { LayoutDashboard, ShieldCheck, Users, Receipt, User } from "lucide-react";

const queryClient = new QueryClient();

const superAdminNav = [
  { to: "/super-admin", label: "Overview", icon: LayoutDashboard },
  { to: "/super-admin/admins", label: "Admins", icon: ShieldCheck },
  { to: "/super-admin/cashiers", label: "Cashiers", icon: Users },
];

const adminNav = [
  { to: "/admin", label: "Cashiers", icon: Users },
  { to: "/admin/payments", label: "Payments", icon: Receipt },
  { to: "/admin/profile", label: "Profile", icon: User },
];

const cashierNav = [
  { to: "/cashier", label: "Payments", icon: Receipt },
  { to: "/cashier/profile", label: "Profile", icon: User },
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/super-admin/login" element={<Login roles={["SUPER_ADMIN"]} defaultRole="SUPER_ADMIN" />} />

              {/* Super Admin */}
              <Route
                element={
                  <ProtectedRoute allow="SUPER_ADMIN">
                    <DashboardLayout title="Super Admin" nav={superAdminNav} />
                  </ProtectedRoute>
                }
              >
                <Route path="/super-admin" element={<SuperAdminDashboard />} />
                <Route path="/super-admin/admins" element={<Admins />} />
                <Route path="/super-admin/cashiers" element={<CashiersPage basePath="/super-admin" />} />
              </Route>

              {/* Admin */}
              <Route
                element={
                  <ProtectedRoute allow="ADMIN">
                    <DashboardLayout title="Admin" nav={adminNav} />
                  </ProtectedRoute>
                }
              >
                <Route path="/admin" element={<CashiersPage basePath="/admin" />} />
                <Route path="/admin/payments" element={<PaymentsPage variant="ADMIN" />} />
                <Route path="/admin/profile" element={<ProfilePage variant="ADMIN" />} />
              </Route>

              {/* Cashier */}
              <Route
                element={
                  <ProtectedRoute allow="CASHIER">
                    <DashboardLayout title="Cashier" nav={cashierNav} />
                  </ProtectedRoute>
                }
              >
                <Route path="/cashier" element={<PaymentsPage variant="CASHIER" />} />
                <Route path="/cashier/profile" element={<ProfilePage variant="CASHIER" />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
