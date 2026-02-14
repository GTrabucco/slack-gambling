import { useAuth0 } from "@auth0/auth0-react";

export const LogoutButton = () => {
  const { logout } = useAuth0();
  const enviornment = process.env.NODE_ENV === 'production' ? 'https://www.slackgambling.com' : 'http://localhost:3000';

  const handleLogout = async () => {
    try {
      logout({
        logoutParams: {
          returnTo: enviornment,
        },
      });
    } catch (error) {
      console.error("Error during logout", error);
    }
  };

  return (
    <span style={{fontFamily: "Segoe UI", fontWeight: 500, fontSize: 16, color: "black"}} onClick={handleLogout}>Log Out</span>
  );
};
