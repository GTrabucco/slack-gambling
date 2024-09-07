import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/AuthProvider";
import StevenNavbar from "../../components/StevenNavbar";

const PrivateRoute = () => {
  const auth = useAuth();
  if (!auth.token) return <Navigate to="/login" />;
  return <React.Fragment><StevenNavbar></StevenNavbar><Outlet /></React.Fragment>;
};

export default PrivateRoute;