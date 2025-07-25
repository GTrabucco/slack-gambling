import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import axios from "axios";
import StevenButton from "./StevenButton";

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
    <StevenButton onClick={handleLogin}>
      Log In
    </StevenButton>
  );
};
