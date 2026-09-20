import { Navigate } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import { useAuth } from "../lib/auth";

export default function LoginPage() {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (user) return <Navigate to="/map" replace />;
  return <AuthForm mode="login" />;
}
