import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const AdminRoute = () => {
  const { user, isLoading } = useAuth0();
  if (isLoading || !user) return null;
  if (user.email.toLowerCase() !== 'giulian.trabucco@gmail.com') return <Navigate to="/dashboard" />;
  return <Outlet />;
};

export default AdminRoute;