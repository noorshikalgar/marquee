import { KeyRound, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ListSkeleton } from "../components/skeletons/ListSkeleton";
import { ApiError } from "../lib/apiClient";
import { useAuth } from "../lib/AuthContext";
import { useAdminUsers, useCreateUser, useDeleteUser, useResetPassword, useUpdateUser, type AdminUser } from "../hooks/useAdmin";

function CreateUserForm() {
  const createUser = useCreateUser();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createUser.mutate(
      { username, password, displayName, role },
      {
        onSuccess: () => {
          setUsername("");
          setPassword("");
          setDisplayName("");
          setRole("member");
        },
        onError: (err) => setError(err instanceof ApiError ? err.message : "Couldn't create user."),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-hairline/5 bg-base-900 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
        <UserPlus className="h-4 w-4 text-amber-400" />
        Add a family member
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="rounded-lg bg-base-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-amber-400"
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="rounded-lg bg-base-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-amber-400"
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="rounded-lg bg-base-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-amber-400"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "member")}
          className="rounded-lg bg-base-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-amber-400"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {error && <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={createUser.isPending}
        className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-accent-ink transition hover:bg-amber-300 disabled:opacity-50"
      >
        {createUser.isPending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}

function UserRow({ user, currentUserId }: { user: AdminUser; currentUserId: number }) {
  const updateUser = useUpdateUser();
  const resetPassword = useResetPassword();
  const deleteUser = useDeleteUser();
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  function handleResetSubmit(e: FormEvent) {
    e.preventDefault();
    resetPassword.mutate(
      { id: user.id, password: newPassword },
      {
        onSuccess: () => {
          setResetMessage("Password updated.");
          setNewPassword("");
          setResetting(false);
        },
        onError: (err) => setResetMessage(err instanceof ApiError ? err.message : "Couldn't reset password."),
      },
    );
  }

  return (
    <div className="rounded-xl border border-hairline/5 bg-base-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-slate-100">
            {user.displayName} <span className="text-xs text-slate-500">@{user.username}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{user.role === "admin" ? "Admin" : "Member"}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={user.role}
            onChange={(e) => updateUser.mutate({ id: user.id, role: e.target.value as "admin" | "member" })}
            className="rounded-lg bg-base-800 px-2 py-1.5 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-amber-400"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setResetting((r) => !r);
              setResetMessage(null);
            }}
            title="Reset password"
            className="rounded-lg bg-base-800 p-2 text-slate-300 transition hover:bg-base-700"
          >
            <KeyRound className="h-4 w-4" />
          </button>
          {user.id !== currentUserId && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete ${user.displayName}'s account? This can't be undone.`)) {
                  deleteUser.mutate(user.id);
                }
              }}
              title="Delete user"
              className="rounded-lg bg-base-800 p-2 text-red-400 transition hover:bg-red-950/60"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {resetting && (
        <form onSubmit={handleResetSubmit} className="mt-3 flex gap-2 border-t border-hairline/5 pt-3">
          <input
            type="password"
            placeholder="New password (min 6 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="flex-1 rounded-lg bg-base-800 px-3 py-1.5 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-amber-400"
          />
          <button
            type="submit"
            disabled={resetPassword.isPending}
            className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-accent-ink transition hover:bg-amber-300 disabled:opacity-50"
          >
            Save
          </button>
        </form>
      )}
      {resetMessage && <p className="mt-2 text-xs text-slate-400">{resetMessage}</p>}
    </div>
  );
}

export function AdminPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useAdminUsers();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <h1 className="flex items-center gap-2 text-xl font-semibold">
        <ShieldCheck className="h-5 w-5 text-amber-400" />
        Admin
      </h1>

      <CreateUserForm />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Users className="h-4 w-4 text-amber-400" />
          Accounts
        </h2>
        {isLoading ? (
          <ListSkeleton count={3} />
        ) : (
          <div className="space-y-3">
            {users?.map((u) => <UserRow key={u.id} user={u} currentUserId={currentUser!.id} />)}
          </div>
        )}
      </section>
    </div>
  );
}
