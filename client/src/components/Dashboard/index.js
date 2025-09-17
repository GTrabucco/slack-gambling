import { useEffect, useState } from "react";
import axios from 'axios';
import './style.css'
import { useAuth0 } from "@auth0/auth0-react";
import StevenNotification from "../StevenNotification";
import StevenPayPopup from "../StevenPayPopup";
import StevenBetCard from "../StevenBetCard";
import StevenGameList from "../StevenGameList";

const Dashboard = () => {
  const [games, setGames] = useState([]);
  const [selectedPicks, setSelectedPicks] = useState([])
  const [tempPicks, setTempPicks] = useState([])
  const [errors, setError] = useState("")
  const [showVenmo, setShowVenmo] = useState(false)
  const [message, setMessage] = useState("");
 
  const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
  const { user } = useAuth0();

  const createUserDetails = async (e) => {
    try {
      const username = user.name;
      await axios.post(`${apiBaseUrl}/api/update-userdetails`, {
        username: username,
        displayName: "",
        receiveSundayReminder: false,
        phoneNumber: ""
      });
      setMessage('Updated User Details');
    } catch (error) {
      setMessage('Error updating user details');
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/userdetails`, {
          params: {
            username: user.name
          }
        });

        const details = response.data[0];
        if (!details) {
          createUserDetails();
        }

        if (!details || !("hasPaid" in details)) {
          setShowVenmo(true);
        } else if (details.hasPaid === false) {
          setShowVenmo(true);
        } else {
          setShowVenmo(false);
        }

      } catch (error) {
        setMessage('Error fetching user details');
      }
    };

    fetchUserDetails();
  }, [user.name, apiBaseUrl]);

  const getCommenceTimeByGameId = (gameId) => {
    const obj = games.find(item => item["_id"] === gameId);
    return obj.commence_time
  }

  const gameStarted = (commenceTime) => {
    const currentTime = new Date();
    const targetTime = new Date(commenceTime);
    return currentTime > targetTime
  }

  return (
    <div className="dashboard-container">
      <StevenNotification
        message={message}
        setMessage={setMessage}
      />
      <br />
      <StevenPayPopup
        showVenmo={showVenmo}
        setShowVenmo={setShowVenmo}
        setMessage={setMessage}
        user={user}
      />
      <StevenBetCard 
        selectedPicks={selectedPicks}
        setMessage={setMessage}
        setError={setError}
        getCommenceTimeByGameId={getCommenceTimeByGameId}
        user={user}
        gameStarted={gameStarted}
        setSelectedPicks={setSelectedPicks}
        setTempPicks={setTempPicks}
      />
      <hr />
      <StevenGameList 
        tempPicks={tempPicks}
        setMessage={setMessage}
        gameStarted={gameStarted}
        setTempPicks={setTempPicks}
        setError={setError}
        user={user}
        selectedPicks={selectedPicks}
        setSelectedPicks={setSelectedPicks}
        getCommenceTimeByGameId={getCommenceTimeByGameId}
        games={games}
        setGames={setGames}
      />
    </div>
  );
};

export default Dashboard;