import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import StevenButton from "./StevenButton";
import authService from "../../services/authService";

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
          await authService.setCookie(token);
        } catch (error) {
          console.error("Error setting token to backend", error);
        }
      }
    };
    setTokenToBackend();
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <StevenButton onClick={handleLogin} fullWidth>
      Log In
    </StevenButton>
  );
};
