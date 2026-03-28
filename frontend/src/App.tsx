import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import InvestigatorLogin from "./pages/InvestigatorLogin";
import AnalystLogin from "./pages/AnalystLogin";
import AdminLogin from "./pages/AdminLogin";

const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const VerificationForm = lazy(() => import("./pages/VerificationForm"));
const ScoreResult = lazy(() => import("./pages/ScoreResult"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const BlockchainExplorer = lazy(() => import("./pages/BlockchainExplorer"));
const CasesList = lazy(() => import("./pages/CasesList"));
const CaseDetail = lazy(() => import("./pages/CaseDetail"));
const CaseNew = lazy(() => import("./pages/CaseNew"));
const AdminUserCreate = lazy(() => import("./pages/AdminUserCreate"));

type AppRole = "SUPER_ADMIN" | "INVESTIGATOR" | "ANALYST";

function Protected({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: AppRole[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="skeleton h-12 w-12 rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (roles && !roles.includes(user.role as AppRole)) {
    if (user.role === "SUPER_ADMIN" || user.role === "ANALYST") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-10 w-1/3 rounded-xl" />
      <div className="skeleton h-40 w-full rounded-[2rem]" />
      <div className="skeleton h-72 w-full rounded-[2rem]" />
    </div>
  );
}

function RoutedPage({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </Layout>
  );
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
          <Protected roles={["INVESTIGATOR", "SUPER_ADMIN"]}>
            <RoutedPage>
              <UserDashboard />
            </RoutedPage>
          </Protected>
        }
      />
      <Route
        path="/verify"
        element={
          <Protected roles={["INVESTIGATOR", "SUPER_ADMIN"]}>
            <RoutedPage>
              <VerificationForm />
            </RoutedPage>
          </Protected>
        }
      />
      <Route
        path="/accounts/:id/result"
        element={
          <Protected roles={["INVESTIGATOR", "SUPER_ADMIN"]}>
            <RoutedPage>
              <ScoreResult />
            </RoutedPage>
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected roles={["SUPER_ADMIN", "ANALYST"]}>
            <RoutedPage>
              <AdminDashboard />
            </RoutedPage>
          </Protected>
        }
      />
      <Route
        path="/admin/users/new"
        element={
          <Protected roles={["SUPER_ADMIN"]}>
            <RoutedPage>
              <AdminUserCreate />
            </RoutedPage>
          </Protected>
        }
      />
      <Route
        path="/cases"
        element={
          <Protected roles={["SUPER_ADMIN", "ANALYST", "INVESTIGATOR"]}>
            <RoutedPage>
              <CasesList />
            </RoutedPage>
          </Protected>
        }
      />
      <Route
        path="/cases/new"
        element={
          <Protected roles={["SUPER_ADMIN", "INVESTIGATOR"]}>
            <RoutedPage>
              <CaseNew />
            </RoutedPage>
          </Protected>
        }
      />
      <Route
        path="/cases/:id"
        element={
          <Protected roles={["SUPER_ADMIN", "ANALYST", "INVESTIGATOR"]}>
            <RoutedPage>
              <CaseDetail />
            </RoutedPage>
          </Protected>
        }
      />
      <Route
        path="/blockchain"
        element={
          <Protected roles={["SUPER_ADMIN", "ANALYST", "INVESTIGATOR"]}>
            <RoutedPage>
              <BlockchainExplorer />
            </RoutedPage>
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
