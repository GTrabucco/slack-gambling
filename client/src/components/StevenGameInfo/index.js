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
  const [cityName, setCityName] = useState("");
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
    let home_team_location = homeTeam.split(" ")[0];
    if (homeTeam.split(" ").length > 2) {
      home_team_location = homeTeam.split(" ")[0] + " " + homeTeam.split(" ")[1];
    } 

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
      case "Buffalo":
        return "Orchard Park"
      case "Dallas":
        return "Arlington"
      case "San Francisco":
        return "Santa Clara"
    }

    return home_team_location;
  };

  const getTimeZone = (city) => {
    const cityTimeZones = {
      "Foxborough": "America/New_York",
      "Orchard Park": "America/New_York",   
      "Miami": "America/New_York",
      "East Rutherford": "America/New_York",
      "Philadelphia": "America/New_York",
      "Washington": "America/New_York",
      "Chicago": "America/Chicago",
      "Detroit": "America/Detroit",
      "Green Bay": "America/Chicago",
      "Minneapolis": "America/Chicago",
      "Atlanta": "America/New_York",
      "Charlotte": "America/New_York",
      "New Orleans": "America/Chicago",
      "Tampa Bay": "America/New_York",
      "Arlington": "America/Chicago",
      "Houston": "America/Chicago",
      "Indianapolis": "America/Indiana/Indianapolis",
      "Jacksonville": "America/New_York",
      "Nashville": "America/Chicago",
      "Denver": "America/Denver", 
      "Kansas City": "America/Chicago",
      "Las Vegas": "America/Los_Angeles",
      "Los Angeles": "America/Los_Angeles",
      "Santa Clara": "America/Los_Angeles",
      "Seattle": "America/Los_Angeles",
      "Glendale": "America/Phoenix",
      "Pittsburgh": "America/New_York"
    };

    return cityTimeZones[city] || "Unknown city";
  }

  const cityCoordinates = {
    "Glendale":      { latitude: 33.5277, longitude: -112.2626 },
    "Atlanta":       { latitude: 33.7490, longitude: -84.3880 },
    "Baltimore":     { latitude: 39.2904, longitude: -76.6122 },
    "Orchard Park":  { latitude: 42.7738, longitude: -78.7869 },
    "Carolina":      { latitude: 35.2251, longitude: -80.8526 },
    "Chicago":       { latitude: 41.8781, longitude: -87.6298 },
    "Cincinnati":    { latitude: 39.1031, longitude: -84.5120 },
    "Cleveland":     { latitude: 41.4993, longitude: -81.6944 },
    "Arlington":     { latitude: 32.7473, longitude: -97.0945 },
    "Denver":        { latitude: 39.7392, longitude: -104.9903 },
    "Detroit":       { latitude: 42.3314, longitude: -83.0458 },
    "Green Bay":     { latitude: 44.5133, longitude: -88.0133 },
    "Houston":       { latitude: 29.7604, longitude: -95.3698 },
    "Indianapolis":  { latitude: 39.7684, longitude: -86.1581 },
    "Jacksonville":  { latitude: 30.3322, longitude: -81.6557 },
    "Kansas City":   { latitude: 39.0997, longitude: -94.5786 },
    "Las Vegas":     { latitude: 36.1699, longitude: -115.1398 },
    "Los Angeles":   { latitude: 34.0522, longitude: -118.2437 }, 
    "Miami":         { latitude: 25.7617, longitude: -80.1918 },
    "Minnesota":     { latitude: 44.9778, longitude: -93.2650 }, 
    "Foxborough":    { latitude: 42.0909, longitude: -71.2643 },
    "New Orleans":   { latitude: 29.9511, longitude: -90.0715 },
    "East Rutherford": { latitude: 40.8128, longitude: -74.0742 }, 
    "Philadelphia":  { latitude: 39.9526, longitude: -75.1652 },
    "Pittsburgh":    { latitude: 40.4406, longitude: -79.9959 },
    "Santa Clara":   { latitude: 37.4030, longitude: -121.9700 },
    "Seattle":       { latitude: 47.6062, longitude: -122.3321 },
    "Tampa Bay":     { latitude: 27.9506, longitude: -82.4572 },
    "Tennessee":     { latitude: 36.1627, longitude: -86.7816 },
    "Washington":    { latitude: 38.9072, longitude: -77.0369 },
  };

  function getCityLatitude(city) {
    return cityCoordinates[city]?.latitude ?? null;
  }

  function getCityLongitude(city) {
    return cityCoordinates[city]?.longitude ?? null;
  }

  const getWeatherDescription = async (details) => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/get-weather-description`, {
        params: { details },
        timeout: 5000,
      });
      console.log('response', response)
    } catch (error) {
      console.log('error')
    }
  }

  const getWeather = async (city, gameDate) => {
    try {
      if (!city || !gameDate) return [];
      const cityLongitude = getCityLongitude(city);
      const cityLatitude = getCityLatitude(city);
      const timeZone = getTimeZone(city) || "UTC";
      const localDate = new Date(new Date(gameDate).toLocaleString("en-US", { timeZone }));
      const formattedDate = localDate.toISOString().split("T")[0];
      const localHour = localDate.getHours();
      const weatherRes = await axios.get("https://api.open-meteo.com/v1/forecast", {
        params: {
            latitude: cityLatitude,
            longitude: cityLongitude,
            hourly: "temperature_2m,precipitation_probability,windspeed_10m",
            timezone: timeZone,
            start_date: formattedDate,
            end_date: formattedDate,
            temperature_unit: "fahrenheit"
        },
      });

      if (!weatherRes) return [];
      const { time, temperature_2m, precipitation_probability, windspeed_10m } = weatherRes.data.hourly;
      if (localHour < 0 || localHour > 23) {
        throw new Error(`Invalid hour: ${localHour}`);
      }

      const block = [];
      for (let i = localHour; i < Math.min(localHour + 4, 24); i++) {
        block.push({
          time: time[i],
          temperature: temperature_2m[i],
          precipitation: precipitation_probability[i],
          wind: windspeed_10m[i]
        });
      }

      return block;
    } catch (error) {
      console.error("Error fetching weather:", error);
      return [];
    }
  };

  const populate = async (homeTeam, gameDate) => {
    try {
      setLoading(true);
      const city = getCityFromTeam(homeTeam);
      setCityName(city)
      const next4Hours = await getWeather(city, gameDate);
      //const weatherDescription = await getWeatherDescription(next4Hours);
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
          <>
            <Row className="m-2">Note: time displayed in local time </Row>
            <Row className="m-2">City: {cityName}</Row>
            <Row className="g-2">
              {weatherData.map((hour) => {
                const [hh, mm] = hour.time.split("T")[1].split(":");
                const hour12 = ((+hh + 11) % 12) + 1;
                const ampm = +hh >= 12 ? "PM" : "AM";
                const formattedTime = `${hour12}:${mm} ${ampm}`;
                return (
                  <Col xs={12} key={hour.time}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <Card.Text className="mb-1">
                          <b>Time:</b> {formattedTime}
                        </Card.Text>
                        <Card.Text className="mb-1">
                          <b>Temp:</b> {hour.temperature}°F
                        </Card.Text>
                        <Card.Text className="mb-1">
                          <b>Wind:</b> {hour.wind} mph
                        </Card.Text>
                        <Card.Text className="mb-1">
                          <b>Precipitation:</b> {hour.precipitation} %
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                )}
              )}
            </Row>
          </>
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