import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useUnreadDigestCount } from "../hooks/useDigests";

export function NotificationBell() {
  const { data } = useUnreadDigestCount();
  const count = data?.count ?? 0;

  return (
    <Link
      to="/notifications"
      className="relative rounded-lg p-2 text-slate-400 transition hover:bg-base-800 hover:text-slate-100"
      title="Notifications"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-accent-ink">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
