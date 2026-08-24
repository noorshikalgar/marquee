import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useUnreadDigestCount } from "../hooks/useDigests";

function BellIcon({ count }: { count: number }) {
  return (
    <span className="relative inline-flex">
      <Bell className="h-4 w-4 shrink-0" />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-accent-ink">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </span>
  );
}

// `asIcon` renders just the bell+badge glyph, for embedding inside a caller's own
// link/button (e.g. a sidebar nav item) instead of the default standalone link.
export function NotificationBell({ asIcon = false }: { asIcon?: boolean }) {
  const { data } = useUnreadDigestCount();
  const count = data?.count ?? 0;

  if (asIcon) return <BellIcon count={count} />;

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
