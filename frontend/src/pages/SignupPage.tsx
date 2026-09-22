import { Navigate } from "react-router-dom";

/** Old /signup bookmark — create-account is a toggle on the same gate. */
export default function SignupPage() {
  return <Navigate to="/" replace />;
}
