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
import PageLoader from "./components/PageLoader";
import { AuthenticationGuard } from "./components/authentication-guard";
import WeekPicks from "./components/WeekPicks";
import JobRunner from "./components/Admin/JobRunner";
import SundayReminderConfig from "./components/Admin/SundayReminderConfig";
import AdvancedStats from "./components/AdvancedStats";
import Statistics from "./components/AdvancedStats/Statistics";
import TeamsBet from "./components/AdvancedStats/TeamsBet";
import WeeklyHeatmap from "./components/AdvancedStats/WeeklyHeatmap";
import PickTiming from "./components/AdvancedStats/PickTiming";
import WeeklyCategoryOdds from "./components/AdvancedStats/WeeklyCategoryOdds";
import BySpreadRange from "./components/AdvancedStats/BySpreadRange";
import TotalsBands from "./components/AdvancedStats/TotalsBands";
import PrimeTimeVsDay from "./components/AdvancedStats/PrimeTimeVsDay";
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
        <Route path="/weekpicks" element={<AuthenticationGuard component={WeekPicks} />}/>
        <Route path="/account" element={<AuthenticationGuard component={UserAccount} /> } />
        <Route path="/pickhistory" element={<AuthenticationGuard component={PickHistory} /> } />
        <Route path="/standings" element={<AuthenticationGuard component={Standings} /> } />
        <Route path="/reportissue" element={<AuthenticationGuard component={ReportIssue} /> } />
        <Route path="/advancedStats" element={<AuthenticationGuard component={AdvancedStats} /> } />
        <Route path="/statistics" element={<AuthenticationGuard component={Statistics} /> } />
        <Route path="/teamsbet" element={<AuthenticationGuard component={TeamsBet} /> } />
        <Route path="/weeklyheatmap" element={<AuthenticationGuard component={WeeklyHeatmap} /> } />
        <Route path="/picktiming" element={<AuthenticationGuard component={PickTiming} /> } />
        <Route path="/weeklycategoryodds" element={<AuthenticationGuard component={WeeklyCategoryOdds} /> } />
        <Route path="/byspreadrange" element={<AuthenticationGuard component={BySpreadRange} /> } />
        <Route path="/totalsbands" element={<AuthenticationGuard component={TotalsBands} /> } />
        <Route path="/primetimevsday" element={<AuthenticationGuard component={PrimeTimeVsDay} /> } />

        <Route element={<AdminRoute />}>
          <Route path="/calculatescoring" element={<AuthenticationGuard component={CalculateScoring} /> } />
          <Route path="/viewreports" element={<AuthenticationGuard component={ViewReports} /> } />
          <Route path="/jobrunner" element={<AuthenticationGuard component={JobRunner} /> } />
          <Route path="/sundayreminderconfig" element={<AuthenticationGuard component={SundayReminderConfig} /> } />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
  );
}

export default App;
