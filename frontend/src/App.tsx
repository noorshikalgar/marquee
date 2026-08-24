import type { ReactElement } from "react";
import { useState } from "react";
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from "react-router-dom";
import { RootLayout } from "./components/layout/RootLayout";
import { OnboardingModal } from "./components/OnboardingModal";
import { PageTransition } from "./components/PageTransition";
import { TourOverlay } from "./components/TourOverlay";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useThemeSync } from "./hooks/useTheme";
import { useAuth } from "./lib/AuthContext";
import { hasActiveServer, isDesktop } from "./lib/serverConfig";
import { AdminPage } from "./pages/AdminPage";
import { AdvancedBrowsePage } from "./pages/AdvancedBrowsePage";
import { BrowsePage } from "./pages/BrowsePage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { DigestDetailPage } from "./pages/DigestDetailPage";
import { ForYouPage } from "./pages/ForYouPage";
import { LikedPage } from "./pages/LikedPage";
import { LoginPage } from "./pages/LoginPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { PersonPage } from "./pages/PersonPage";
import { SearchPage } from "./pages/SearchPage";
import { ServerSetupPage } from "./pages/ServerSetupPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TitleDetailPage } from "./pages/TitleDetailPage";
import { WatchlistPage } from "./pages/WatchlistPage";

function AdminRoute({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

// The root layout route: gates on auth, then renders the app chrome (sidebar,
// onboarding, tour) around whichever child route matched. Living as a route
// component (rather than App's old early-return style) is what lets navigate()/
// <Link> use React Router's native view-transition support, which only works in
// Data Router mode (createBrowserRouter + RouterProvider), not plain <BrowserRouter>.
function RootRoute() {
  const online = useOnlineStatus();
  const location = useLocation();
  const { user, loading } = useAuth();
  useThemeSync();

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center text-sm text-slate-500">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <>
      <OnboardingModal />
      <TourOverlay />
      <RootLayout online={online}>
        <Outlet />
      </RootLayout>
    </>
  );
}

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <RootRoute />,
    children: [
      { index: true, element: <PageTransition><BrowsePage /></PageTransition> },
      { path: "search", element: <PageTransition><SearchPage /></PageTransition> },
      { path: "discover", element: <PageTransition><AdvancedBrowsePage /></PageTransition> },
      { path: "coming-soon", element: <PageTransition><ComingSoonPage /></PageTransition> },
      { path: "my", element: <Navigate to="/my/liked" replace /> },
      { path: "my/liked", element: <PageTransition><LikedPage /></PageTransition> },
      { path: "my/watchlist", element: <PageTransition><WatchlistPage /></PageTransition> },
      { path: "my/for-you", element: <PageTransition><ForYouPage /></PageTransition> },
      { path: "for-you", element: <Navigate to="/my/for-you" replace /> },
      { path: "watchlist", element: <Navigate to="/my/watchlist" replace /> },
      { path: "playlists/:id", element: <Navigate to="/my/for-you" replace /> },
      { path: "notifications", element: <PageTransition><NotificationsPage /></PageTransition> },
      { path: "notifications/:id", element: <PageTransition><DigestDetailPage /></PageTransition> },
      { path: "settings", element: <PageTransition><SettingsPage /></PageTransition> },
      { path: "admin", element: <AdminRoute><PageTransition><AdminPage /></PageTransition></AdminRoute> },
      { path: "title/:mediaType/:tmdbId", element: <PageTransition><TitleDetailPage /></PageTransition> },
      { path: "person/:personId", element: <PageTransition><PersonPage /></PageTransition> },
    ],
  },
]);

export function App() {
  const [serverConnected, setServerConnected] = useState(hasActiveServer());

  if (isDesktop() && !serverConnected) {
    return <ServerSetupPage onConnected={() => setServerConnected(true)} />;
  }

  return <RouterProvider router={router} />;
}
