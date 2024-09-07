import { useContext, createContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios'
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || "");
  const [token, setToken] = useState(localStorage.getItem("site") || "");
  const navigate = useNavigate();
  const loginAction = async (loginData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', loginData);
      if (response.data) {
        setUser(response.data.user);
        setToken(response.data.token);
        console.log(response.data.user)
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("site", response.data.token);
        navigate("/dashboard");
        return;
      }

    } catch (error) {
      throw new Error(error.response ? error.response.data.error : 'An error occurred during login');
    }
  };

  const logOut = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("user");
    localStorage.removeItem("site");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ token, user, loginAction, logOut }}>
      {children}
    </AuthContext.Provider>
  );

};

export default AuthProvider;

export const useAuth = () => {
  return useContext(AuthContext);
};