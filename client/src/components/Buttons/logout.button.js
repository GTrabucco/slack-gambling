import { useAuth0 } from "@auth0/auth0-react";
import React from "react";
import { Button } from "react-bootstrap";
import axios from "axios";

export const LogoutButton = () => {
  const { logout } = useAuth0();

  const handleLogout = async () => {
    try {
      logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
    } catch (error) {
      console.error("Error during logout", error);
    }
  };

  return (
    <Button className="button__logout" onClick={handleLogout}>
      Log Out
    </Button>
  );
};
