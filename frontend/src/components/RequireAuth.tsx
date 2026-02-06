import React from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../api/auth";

type Props = {
  children: React.ReactNode;
};

export function RequireAuth({ children }: Props) {
  return isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;
}
