import { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, Card } from "react-bootstrap";
import PageLoader from "../PageLoader";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import StevenButton from "../Common/StevenButton";

const StevenGameInfo = ({ showStevenInfo, selectedGameId, setShowStevenInfo }) => {
  const [errors, setErrors] = useState("");
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = process.env.NODE_ENV === "production" ? "" : "http://localhost:5000";
  const handleShowStevenInfo = () => {
    setShowStevenInfo(false);
  };

  const getGame = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/get-game`, {
        params: { gameId: selectedGameId },
        timeout: 5000, 
      });

      const game = response.data?.[0];
      if (!game) throw new Error("Game not found");

      await populate(game.home_team, game.commence_time);
    } catch (error) {
      console.error("Error fetching game:", error);
      setErrors("Error fetching game data");
      setWeatherData([]);
      setLoading(false);
    }
  };

  const getCityFromTeam = (homeTeam) => {
    if (!homeTeam) return "";
    let home_team_location = homeTeam.split(" ").slice(0, 2).join(" ");
    switch (home_team_location) {
      case "New England":
        return "Foxborough";
      case "Arizona":
        return "Glendale";
      case "Carolina":
        return "Charlotte";
      case "Minnesotta":
        return "Minneapolis";
      case "Tennessee":
        return "Nashville";
      case "New York":
        return "East Rutherford";
      default:
        return home_team_location.split(" ")[0]; 
    }
  };

  const getWeather = async (city, gameDate) => {
    try {
      if (!city || !gameDate) return [];
      const dateObj = new Date(gameDate);
      const date = dateObj.toISOString().split("T")[0];
      const localHour = dateObj.getHours();
      const response = await axios.get(`${apiBaseUrl}/api/weather`, {
        params: { city, date },
        timeout: 5000,
      });

      const forecastDay = response.data?.forecast?.forecastday?.[0];
      if (!forecastDay || !Array.isArray(forecastDay.hour)) return [];
      const startIndex = forecastDay.hour.findIndex((h) => new Date(h.time).getHours() === localHour);
      if (startIndex === -1) return [];
      return forecastDay.hour.slice(startIndex, startIndex + 4);
    } catch (error) {
      console.error("Error fetching weather:", error);
      return [];
    }
  };

  const populate = async (homeTeam, gameDate) => {
    try {
      setLoading(true);
      const city = getCityFromTeam(homeTeam);
      const next4Hours = await getWeather(city, gameDate);
      setWeatherData(next4Hours);
    } catch (error) {
      console.error("Error populating weather:", error);
      setWeatherData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showStevenInfo) getGame();
    else {
      setWeatherData([]);
      setLoading(true);
      setErrors("");
    }
  }, [showStevenInfo, selectedGameId]);

  return (
    <Dialog open={showStevenInfo} onClose={handleShowStevenInfo} maxWidth="sm" fullWidth>
      <DialogContent dividers>
        {loading ? (
          <PageLoader />
        ) : weatherData.length ? (
          <Row className="g-2">
            {weatherData.map((hour) => {
              const [hh, mm] = hour.time.split(" ")[1].split(":");
              const hour12 = ((+hh + 11) % 12) + 1;
              const ampm = +hh >= 12 ? "PM" : "AM";
              const formattedTime = `${hour12}:${mm} ${ampm}`;
              return (
                <Col xs={12} key={hour.time}>
                  <Card className="shadow-sm">
                    <Card.Body>
                      <Card.Title className="mb-2">{formattedTime}</Card.Title>
                      <Card.Text className="mb-1">
                        <b>Condition:</b> {hour.condition.text}
                      </Card.Text>
                      <Card.Text className="mb-1">
                        <b>Temp:</b> {hour.temp_f}°F
                      </Card.Text>
                      <Card.Text className="mb-1">
                        <b>Wind:</b> {hour.wind_mph} mph
                      </Card.Text>
                      <Card.Text className="mb-1">
                        <b>Rain:</b> {hour.chance_of_rain}%
                      </Card.Text>
                      <Card.Text className="mb-1">
                        <b>Snow:</b> {hour.chance_of_snow}%
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <p>No weather data available</p>
        )}
      </DialogContent>
      <DialogActions>
        <StevenButton onClick={handleShowStevenInfo}>Close</StevenButton>
      </DialogActions>
    </Dialog>
  );
};

export default StevenGameInfo;