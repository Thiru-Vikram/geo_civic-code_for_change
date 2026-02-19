import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import AddReport from "./pages/AddReport";
import Profile from "./pages/Profile";
import ReportDetails from "./pages/ReportDetails";
import MainLayout from "./components/MainLayout";
import StaffLayout from "./components/StaffLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffAllReports from "./pages/staff/StaffAllReports";
import StaffReportDetail from "./pages/staff/StaffReportDetail";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAllReports from "./pages/admin/AdminAllReports";
import AdminReportDetail from "./pages/admin/AdminReportDetail";
import StaffMyTasks from "./pages/staff/StaffMyTasks";
import "./App.css";

// Protected Route for regular users
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) return <Navigate to="/login" />;
  if (user.role === "STAFF") return <Navigate to="/staff/dashboard" />;
  if (user.role === "ADMIN") return <Navigate to="/admin/dashboard" />;
  return children;
};

// Protected Route for staff only
const StaffRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "STAFF") return <Navigate to="/login" />;
  return children;
};

// Protected Route for admin only
const AdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "ADMIN") return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-white">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Regular User Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/:id" element={<ReportDetails />} />
            <Route path="add-report" element={<AddReport />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Staff Protected Routes */}
          <Route
            path="/staff"
            element={
              <StaffRoute>
                <StaffLayout />
              </StaffRoute>
            }
          >
            <Route index element={<Navigate to="/staff/dashboard" />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="tasks" element={<StaffMyTasks />} />
            <Route path="tasks/:id" element={<StaffReportDetail />} />
            <Route path="reports" element={<StaffAllReports />} />
            <Route path="reports/:id" element={<StaffReportDetail />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="reports" element={<AdminAllReports />} />
            <Route path="reports/:id" element={<AdminReportDetail />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
