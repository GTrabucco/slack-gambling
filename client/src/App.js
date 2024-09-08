import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AuthProvider, { useAuth } from "./hooks/AuthProvider";
import PrivateRoute from "./router/PrivateRouter";
import UserAccount from "./components/UserAccount";
import PickHistory from "./components/PickHistory";
import Standings from "./components/Standings";
import CalculateScoring from "./components/CalculateScoring";
import AdminRoute from "./router/AdminRouter";
import { disableReactDevTools } from '@fvilers/disable-react-devtools';

if (process.env.NODE_ENV === 'production') disableReactDevTools();

function HomeRedirect() {
  const { token } = useAuth();
  return token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />;
}

function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/account" element={<UserAccount />} />
              <Route path="/pickhistory" element={<PickHistory />} />
              <Route path="/standings" element={<Standings />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/calculatescoring" element={<CalculateScoring />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;