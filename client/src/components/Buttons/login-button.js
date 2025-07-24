import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect } from "react";
import Button from '@mui/material/Button';
import axios from "axios";
import "./style.css";

export const LoginButton = () => {
  const { loginWithRedirect, getAccessTokenSilently, isAuthenticated } = useAuth0();
  const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

  const handleLogin = async () => {
    await loginWithRedirect({
      appState: {
        returnTo: "/dashboard",
      },
    });
  };

  useEffect(() => {
    const setTokenToBackend = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          await axios.post(`${apiBaseUrl}/api/set-cookie`, { token }, { withCredentials: true });
        } catch (error) {
          console.error("Error setting token to backend", error);
        }
      }
    };
    setTokenToBackend();
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <Button className="steven-btn" onClick={handleLogin}>
      Log In
    </Button>
  );
};
