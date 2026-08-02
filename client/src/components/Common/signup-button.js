import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect } from "react";
import StevenButton from "./StevenButton";
import authService from "../../services/authService";

export const SignupButton = () => {
  const { loginWithRedirect, getAccessTokenSilently, isAuthenticated } = useAuth0();

  const handleSignUp = async () => {
    await loginWithRedirect({
      appState: {
        returnTo: "/dashboard",
      },
      authorizationParams: {
        screen_hint: "signup",
      },
    });
  };

  useEffect(() => {
    const setTokenToBackend = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently();
          await authService.setCookie(token);
        } catch (error) {
          console.error("Error setting token to backend", error);
        }
      }
    };
    setTokenToBackend();
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <StevenButton onClick={handleSignUp} fullWidth variant="outlined">
      Sign Up
    </StevenButton>
  );
};
