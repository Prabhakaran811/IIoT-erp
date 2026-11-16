import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../features/dashboard/Dashboard";
import CustomerManagement from "../features/customers/pages/CustomerManagement";
import ProjectManagement from "../features/projects/pages/ProjectManagement";
import DeliveryChallanManagement from "../features/deliveryChallans/pages/DeliveryChallanManagement";
import ServiceReportManagement from "../features/serviceReports/pages/ServiceReportManagement";
import PageHeader from "../components/common/PageHeader";
import { NAV_SECTIONS } from "../utils/constants";

const placeholders = NAV_SECTIONS.flatMap((s) => s.items).filter(
  (i) => !["/dashboard", "/customers", "/projects", "/delivery-challans"].includes(i.path)
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* public */}
      <Route path="/login" element={<Login />} />

      {/* protected: login required */}
      <Route element={<ProtectedRoute />}>
        {/* layout: sidebar + navbar */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/projects" element={<ProjectManagement />} />
          <Route path="/delivery-challans" element={<DeliveryChallanManagement />} />
          <Route path="/service-reports" element={<ServiceReportManagement />} />

          {placeholders.map((p) => (
            <Route
              key={p.path}
              path={p.path}
              element={<PageHeader title={p.label} subtitle="Coming soon" />}
            />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}