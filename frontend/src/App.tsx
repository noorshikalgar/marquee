import { AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";
import type { ReactElement } from "react";
import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { NavBar } from "./components/layout/NavBar";
import { OnboardingModal } from "./components/OnboardingModal";
import { PageTransition } from "./components/PageTransition";
import { TourOverlay } from "./components/TourOverlay";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useThemeSync } from "./hooks/useTheme";
import { useAuth } from "./lib/AuthContext";
import { useLanguage } from "./lib/i18n/LanguageContext";
import { isDesktop, hasServerUrl } from "./lib/serverConfig";
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
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const [serverConnected, setServerConnected] = useState(hasServerUrl());
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
    <div className="min-h-dvh">
      <OnboardingModal />
      <TourOverlay />
      <NavBar />
      {!online && (
        <div className="flex items-center justify-center gap-2 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-300">
          <WifiOff className="h-3.5 w-3.5" />
          {t("common_offline")}
        </div>
      )}
      <main>
        <AnimatePresence mode="wait" initial={false}>
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
      </main>
    </div>
  );
}
