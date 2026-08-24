import { AnimatePresence } from "framer-motion";
import type { ReactElement } from "react";
import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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

export function App() {
  const online = useOnlineStatus();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [serverConnected, setServerConnected] = useState(hasActiveServer());
  useThemeSync();

  if (isDesktop() && !serverConnected) {
    return <ServerSetupPage onConnected={() => setServerConnected(true)} />;
  }

  if (location.pathname === "/login") {
    return <LoginPage />;
  }

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
        <AnimatePresence mode="popLayout" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><BrowsePage /></PageTransition>} />
            <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
            <Route path="/discover" element={<PageTransition><AdvancedBrowsePage /></PageTransition>} />
            <Route path="/coming-soon" element={<PageTransition><ComingSoonPage /></PageTransition>} />
            <Route path="/my" element={<Navigate to="/my/liked" replace />} />
            <Route path="/my/liked" element={<PageTransition><LikedPage /></PageTransition>} />
            <Route path="/my/watchlist" element={<PageTransition><WatchlistPage /></PageTransition>} />
            <Route path="/my/for-you" element={<PageTransition><ForYouPage /></PageTransition>} />
            <Route path="/for-you" element={<Navigate to="/my/for-you" replace />} />
            <Route path="/watchlist" element={<Navigate to="/my/watchlist" replace />} />
            <Route path="/playlists/:id" element={<Navigate to="/my/for-you" replace />} />
            <Route path="/notifications" element={<PageTransition><NotificationsPage /></PageTransition>} />
            <Route path="/notifications/:id" element={<PageTransition><DigestDetailPage /></PageTransition>} />
            <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
            <Route path="/admin" element={<AdminRoute><PageTransition><AdminPage /></PageTransition></AdminRoute>} />
            <Route path="/title/:mediaType/:tmdbId" element={<PageTransition><TitleDetailPage /></PageTransition>} />
            <Route path="/person/:personId" element={<PageTransition><PersonPage /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </RootLayout>
    </>
  );
}
