import { useState } from "react";
import { Clock, LayoutDashboard, LogOut, Map, Menu, Shield, UserRound, X } from "lucide-react";
import { Link, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { CedarMark } from "./components/CedarMark";
import { UserAvatar, profileLabel } from "./components/UserAvatar";
import { useAuth } from "./lib/auth";
import AuthGatePage from "./pages/AuthGatePage";
import AdminPage from "./pages/AdminPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="night-watch flex min-h-dvh flex-col items-center justify-center gap-3 text-[#fff8e7]">
        <CedarMark className="h-12 w-12" />
        <p className="font-display text-xl">CedarWatch</p>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#d4a017]">
          Opening the lookout
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<AuthGatePage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Navigate to="/" replace />} />
        <Route path="*" element={<RedirectToGate />} />
      </Routes>
    );
  }

  return <LookoutShell />;
}

function RedirectToGate() {
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;
  const keep =
    from && from !== "/" && !from.startsWith("/login") && !from.startsWith("/signup")
      ? { from }
      : undefined;
  return <Navigate to="/" replace state={keep} />;
}

function LookoutShell() {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="min-h-dvh overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-[#d4a017]/35 bg-[var(--cedar-dark)] text-[#fff8e7]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a017] to-transparent" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-6">
          <Link
            to="/"
            onClick={closeMenu}
            className="flex min-h-11 items-center gap-2"
          >
            <CedarMark className="h-9 w-9 shrink-0" />
            <span className="leading-tight">
              <span className="font-display block text-lg leading-none">CedarWatch</span>
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-[#d4a017]">
                Lebanon lookout
                <span className="font-arabic normal-case tracking-normal" dir="rtl" lang="ar">
                  لبنان
                </span>
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <DesktopNav
              userEmail={user?.email}
              profile={profile}
              onSignOut={() => void signOut()}
            />
          </nav>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-white/10 px-3 py-3 md:hidden">
            <MobileItem to="/" onClick={closeMenu} icon={<LayoutDashboard className="h-4 w-4" />}>
              Dashboard
            </MobileItem>
            <MobileItem to="/map" onClick={closeMenu} icon={<Map className="h-4 w-4" />}>
              Map
            </MobileItem>
            <MobileItem to="/history" onClick={closeMenu} icon={<Clock className="h-4 w-4" />}>
              History
            </MobileItem>
            <MobileItem to="/profile" onClick={closeMenu} icon={<UserRound className="h-4 w-4" />}>
              Profile
            </MobileItem>
            {profile?.isAdmin && (
              <MobileItem to="/admin" onClick={closeMenu} icon={<Shield className="h-4 w-4" />}>
                Admin
              </MobileItem>
            )}
            <div className="flex items-center gap-2 px-3 py-2">
              <UserAvatar profile={profile} email={user?.email} size="sm" />
              <p className="truncate text-xs text-[#d4a017]">
                {profileLabel(profile, user?.email)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void signOut();
                closeMenu();
              }}
              className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function DesktopNav({
  userEmail,
  profile,
  onSignOut,
}: {
  userEmail?: string;
  profile: ReturnType<typeof useAuth>["profile"];
  onSignOut: () => void;
}) {
  return (
    <>
      <HeaderLink to="/" icon={<LayoutDashboard className="h-4 w-4" />}>
        Dashboard
      </HeaderLink>
      <HeaderLink to="/map" icon={<Map className="h-4 w-4" />}>
        Map
      </HeaderLink>
      <HeaderLink to="/history" icon={<Clock className="h-4 w-4" />}>
        History
      </HeaderLink>
      {profile?.isAdmin && (
        <HeaderLink to="/admin" icon={<Shield className="h-4 w-4" />}>
          Admin
        </HeaderLink>
      )}
      <Link
        to="/profile"
        className="ml-1 flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-2 py-1 pr-3"
      >
        <UserAvatar profile={profile} email={userEmail} size="sm" />
        <span className="max-w-[120px] truncate text-xs">
          {profileLabel(profile, userEmail)}
        </span>
      </Link>
      <button
        type="button"
        onClick={onSignOut}
        className="flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-sm transition hover:bg-white/10"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </>
  );
}

function HeaderLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-sm transition ${
          isActive ? "bg-white/15 text-[#d4a017]" : "hover:bg-white/10"
        }`
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}

function MobileItem({
  to,
  icon,
  onClick,
  children,
}: {
  to: string;
  icon?: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm ${
          isActive ? "bg-white/15 text-[#d4a017]" : "hover:bg-white/10"
        }`
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
