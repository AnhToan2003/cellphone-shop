import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

type AdminRouteProps = {
  children: JSX.Element;
};

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, token } = useAuth();
  if (!token || !user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return children;
}
