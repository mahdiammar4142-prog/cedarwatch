import { Navigate } from "react-router-dom";

/** Old /login bookmark — the lookout gate lives at /. */
export default function LoginPage() {
  return <Navigate to="/" replace />;
}
