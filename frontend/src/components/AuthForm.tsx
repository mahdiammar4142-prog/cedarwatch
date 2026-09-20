import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../lib/auth";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const { signIn, signUp, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/map";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isLogin = mode === "login";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate(from, { replace: true });
      } else {
        const result = await signUp(email, password);
        if (result.needsEmailConfirmation) {
          setMessage("Account created. Check your email to confirm, then sign in.");
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-emerald-900/10 bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--cedar-dark)]">
            {isLogin ? "Sign in" : "Create an account"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {isLogin
              ? "Sign in to report and confirm outages."
              : "Sign up to report outages in your area."}
          </p>
        </div>

        {!configured && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env,
            then restart the Vite server.
          </p>
        )}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--cedar-green)] focus:outline-none focus:ring-1 focus:ring-[var(--cedar-green)]"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[var(--cedar-green)] focus:outline-none focus:ring-1 focus:ring-[var(--cedar-green)]"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {message && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !configured}
          className="w-full rounded-lg bg-[var(--cedar-green)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--cedar-green-light)] disabled:opacity-60"
        >
          {loading ? "Please wait..." : isLogin ? "Sign in" : "Sign up"}
        </button>

        <p className="text-center text-sm text-slate-600">
          {isLogin ? (
            <>
              No account?{" "}
              <Link to="/signup" className="font-medium text-[var(--cedar-green)] hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-[var(--cedar-green)] hover:underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
