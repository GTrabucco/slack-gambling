import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const AdminRoute = () => {
  const {user} = useAuth0();
  if (user.email.toLowerCase() !== 'giulian.trabucco@gmail.com') return <Navigate to="/dashboard" />;
  return <Outlet />;
};

export default AdminRoute;