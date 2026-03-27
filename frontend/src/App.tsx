import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import InvestigatorLogin from "./pages/InvestigatorLogin";
import AnalystLogin from "./pages/AnalystLogin";
import AdminLogin from "./pages/AdminLogin";
import UserDashboard from "./pages/UserDashboard";
import VerificationForm from "./pages/VerificationForm";
import ScoreResult from "./pages/ScoreResult";
import AdminDashboard from "./pages/AdminDashboard";
import BlockchainExplorer from "./pages/BlockchainExplorer";
import CasesList from "./pages/CasesList";
import CaseDetail from "./pages/CaseDetail";
import CaseNew from "./pages/CaseNew";

function Protected({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "SUPER_ADMIN" | "INVESTIGATOR" | "ANALYST";
}) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="skeleton h-12 w-12 rounded-full" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) {
    // Route user to an appropriate home based on role.
    if (user.role === "SUPER_ADMIN" || user.role === "ANALYST") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login/investigator" element={<InvestigatorLogin />} />
      <Route path="/login/analyst" element={<AnalystLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/dashboard"
        element={
          <Protected role="INVESTIGATOR">
            <Layout>
              <UserDashboard />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/verify"
        element={
          <Protected role="INVESTIGATOR">
            <Layout>
              <VerificationForm />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/accounts/:id/result"
        element={
          <Protected role="INVESTIGATOR">
            <Layout>
              <ScoreResult />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected>
            <Layout>
              <AdminDashboard />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/cases"
        element={
          <Protected>
            <Layout>
              <CasesList />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/cases/new"
        element={
          <Protected>
            <Layout>
              <CaseNew />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/cases/:id"
        element={
          <Protected>
            <Layout>
              <CaseDetail />
            </Layout>
          </Protected>
        }
      />
      <Route path="/blockchain" element={<Layout><BlockchainExplorer /></Layout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
