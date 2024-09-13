import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import { useAuth0 } from "@auth0/auth0-react";
import UserAccount from "./components/UserAccount";
import PickHistory from "./components/PickHistory";
import Standings from "./components/Standings";
import CalculateScoring from "./components/Admin/CalculateScoring";
import AdminRoute from "./router/AdminRouter";
import { disableReactDevTools } from '@fvilers/disable-react-devtools';
import ReportIssue from "./components/ReportIssue";
import ViewReports from "./components/Admin/ViewReports";
import Statistics from "./components/Statistics";
import PageLoader from "./components/PageLoader";
import { CallbackPage } from "./components/callback-page";
import { AuthenticationGuard } from "./components/authentication-guard";
if (process.env.NODE_ENV === 'production') disableReactDevTools();

function App() {
  const { isLoading, isAuthenticated } = useAuth0();
  
  if (isLoading) {
    return (
      <div className="page-layout">
        <PageLoader />
      </div>
    );
  }

  function HomeRedirect() {
    return isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
  }

  return (
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<AuthenticationGuard component={Dashboard} />}/>
        <Route path="/account" element={<AuthenticationGuard component={UserAccount} /> } />
        <Route path="/pickhistory" element={<AuthenticationGuard component={PickHistory} /> } />
        <Route path="/standings" element={<AuthenticationGuard component={Standings} /> } />
        <Route path="/reportissue" element={<AuthenticationGuard component={ReportIssue} /> } />
        <Route path="/statistics" element={<AuthenticationGuard component={Statistics} /> } />
        <Route path="/callback" element={<AuthenticationGuard component={CallbackPage} /> } />

        <Route element={<AdminRoute />}>
          <Route path="/calculatescoring" element={<AuthenticationGuard component={CalculateScoring} /> } />
          <Route path="/viewreports" element={<AuthenticationGuard component={ViewReports} /> } />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
  );
}

export default App;