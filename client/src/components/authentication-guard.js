import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import React, { useEffect } from "react";
import PageLoader from "./PageLoader";
import StevenNavbar from "./StevenNavbar";

export const AuthenticationGuard = ({ component }) => {
  const { isAuthenticated, getAccessTokenSilently, loginWithRedirect, error } = useAuth0();
  const WrappedComponent = withAuthenticationRequired(component, {
    onRedirecting: () => (
      <div className="page-layout">
        <PageLoader />
      </div>
    ),
  });

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!isAuthenticated) {
        try {
          await getAccessTokenSilently();
        } catch (error) {
          if (error.error === 'login_required') {
            loginWithRedirect();
          } else {
            console.error('Silent authentication failed', error);
          }
        }
      }
    };

    checkAuthentication();
  }, [isAuthenticated, getAccessTokenSilently, loginWithRedirect]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return isAuthenticated ? (
    <div className="authenticated-layout">
      <StevenNavbar />
      <div className="content">
        <WrappedComponent />
      </div>
    </div>
  ) : (
    <PageLoader />
  );
};
