import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect } from "react";
import { Button } from "react-bootstrap";
import axios from "axios";

export const LoginButton = () => {
  const { loginWithRedirect, getAccessTokenSilently, isAuthenticated } = useAuth0();

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
          await axios.post('/api/set-cookie', { token }, { withCredentials: true });
        } catch (error) {
          console.error("Error setting token to backend", error);
        }
      }
    };
    setTokenToBackend();
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <Button className="button__login" onClick={handleLogin}>
      Log In
    </Button>
  );
};
