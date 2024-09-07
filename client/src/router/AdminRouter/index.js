import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/AuthProvider";
import StevenNavbar from "../../components/StevenNavbar";

const AdminRoute = () => {
  const auth = useAuth();
  if (!auth.user.admin) auth.logOut();
  return <React.Fragment><StevenNavbar></StevenNavbar><Outlet /></React.Fragment>;
};

export default AdminRoute;