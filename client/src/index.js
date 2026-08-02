import React from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import reportWebVitals from './reportWebVitals';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './index.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const root = createRoot(document.getElementById('root'));
const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
const audience = process.env.REACT_APP_AUTH0_AUDIENCE;

root.render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: audience,
          scope: "openid profile email read:current_user update:current_user_metadata read:users read:user_idp_tokens" 
        }}
      >
        <App />
      </Auth0Provider>
    </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);

reportWebVitals();
