import { Activity, Clock, LayoutDashboard, LogOut, Map } from "lucide-react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import SignupPage from "./pages/SignupPage";

export default function App() {
  const { user, loading, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-emerald-900/10 bg-[var(--cedar-dark)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Activity className="h-6 w-6 text-emerald-300" />
            <span>CedarWatch</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/" icon={<LayoutDashboard className="h-4 w-4" />}>
              Dashboard
            </NavLink>
            <NavLink to="/map" icon={<Map className="h-4 w-4" />}>
              Map
            </NavLink>
            <NavLink to="/history" icon={<Clock className="h-4 w-4" />}>
              History
            </NavLink>
            {loading ? null : user ? (
              <>
                <span className="hidden max-w-[160px] truncate px-2 text-xs text-emerald-100 sm:inline">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-emerald-100 transition hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm text-emerald-100 transition hover:bg-white/10"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function NavLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-emerald-100 transition hover:bg-white/10"
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}
