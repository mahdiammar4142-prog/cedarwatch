import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { markGatePassed, sanitizeReturnPath } from "../lib/gate";

type Mode = "login" | "signup";

export function AuthForm() {
  const { signIn, signUp, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchNext = new URLSearchParams(location.search).get("next");
  const from = sanitizeReturnPath(
    (location.state as { from?: string } | null)?.from ?? searchNext ?? "/"
  );

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isLogin = mode === "login";

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setConfirmPassword("");
    if (next === "signup") setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (isLogin) {
        await signIn(email, password);
        markGatePassed();
        navigate(from, { replace: true });
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        const result = await signUp(email, password);
        if (result.needsEmailConfirmation) {
          setMode("login");
          setMessage("Account created. Check your email to confirm, then sign in.");
        } else {
          markGatePassed();
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
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <h1 className="font-display text-3xl text-[var(--cedar-dark)]">
          {isLogin ? "Come on watch" : "Take a post"}
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          {isLogin
            ? "Sign in to pin outages and confirm what your street already knows."
            : "Create an account to file reports from your neighborhood."}
        </p>
      </div>

      <div className="grid grid-cols-2 rounded-full bg-[var(--cedar-dark)]/8 p-1">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`min-h-11 rounded-full text-sm font-semibold transition ${
            isLogin
              ? "bg-[var(--cedar-dark)] text-[#fff8e7]"
              : "text-[var(--cedar-dark)]/70"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`min-h-11 rounded-full text-sm font-semibold transition ${
            !isLogin
              ? "bg-[var(--cedar-dark)] text-[#fff8e7]"
              : "text-[var(--cedar-dark)]/70"
          }`}
        >
          Create account
        </button>
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
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
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
          autoComplete={isLogin ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field"
        />
      </div>

      {!isLogin && (
        <div>
          <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="field"
          />
        </div>
      )}

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
        className="btn-primary w-full disabled:opacity-60"
      >
        {loading ? "Please wait..." : isLogin ? "Enter the lookout" : "Join this shift"}
      </button>
    </form>
  );
}
