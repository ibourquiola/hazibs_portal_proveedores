import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ResetPassword from "./pages/ResetPassword";
import SetupPassword from "./pages/SetupPassword";
import NotFound from "./pages/NotFound";
import Ofertas from "./pages/Ofertas";
import OfferDetail from "./pages/OfferDetail";
import Pedidos from "./pages/Pedidos";
import OrderDetail from "./pages/OrderDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Proveedores from "./pages/admin/Proveedores";
import ProveedorDetalle from "./pages/admin/ProveedorDetalle";
import AdminOfertas from "./pages/admin/AdminOfertas";
import AdminPedidos from "./pages/admin/AdminPedidos";
import AdminOfferDetail from "./pages/admin/AdminOfferDetail";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          
          {/* Supplier Dashboard */}
          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="ofertas" element={<Ofertas />} />
            <Route path="ofertas/:offerId" element={<OfferDetail />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="pedidos/:orderId" element={<OrderDetail />} />
          </Route>
          
          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminDashboard />}>
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="proveedores/:id" element={<ProveedorDetalle />} />
            <Route path="ofertas" element={<AdminOfertas />} />
            <Route path="ofertas/:offerId" element={<AdminOfferDetail />} />
            <Route path="pedidos" element={<AdminPedidos />} />
            <Route path="pedidos/:orderId" element={<AdminOrderDetail />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
