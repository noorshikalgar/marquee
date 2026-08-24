import { WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { MobileTopBar } from "./MobileTopBar";
import { Sidebar } from "./Sidebar";

export function RootLayout({ online, children }: { online: boolean; children: ReactNode }) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-300">
            <WifiOff className="h-3.5 w-3.5" />
            {t("common_offline")}
          </div>
        )}
        <main className="relative flex-1">{children}</main>
      </div>
    </div>
  );
}
