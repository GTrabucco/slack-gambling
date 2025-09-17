import { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col } from 'react-bootstrap';
import ListGroup from 'react-bootstrap/ListGroup';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import StevenButton from "../Common/StevenButton";
import { Card } from "react-bootstrap";
const StevenGameInfo = ({ showStevenInfo, selectedGameId, setShowStevenInfo }) => {
    const [errors, setErrors] = useState("");
    const [homeTeam, setHomeTeam] = useState("")
    const [gameDate, setGameDate] = useState("")
    const [weatherData, setWeatherData] = useState("")
    const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
    const handleShowStevenInfo = () => {
        setShowStevenInfo(false);
    };

    const getGame = async () => {
        try {
            const response = await axios.get(`${apiBaseUrl}/api/get-game`, {
                params: { gameId: selectedGameId }
            });

            const game = response.data[0]
            setHomeTeam(game["home_team"])
            setGameDate(game["commence_time"])
            await populate()
        } catch (error) {
            setErrors('Error fetching game');
        }
    };

    useEffect(()=>{
        if (showStevenInfo) {
            getGame();   
        }
    }, [showStevenInfo])

    const getNext4HoursForecastByHour = (data, hour) => {
        const hours = data.hour;
        const startIndex = hours.findIndex(h => {
            const hHour = new Date(h.time).getHours();
            return hHour === hour;
        });
        if (startIndex === -1) return [];
        return hours.slice(startIndex, startIndex + 4);
    }

    const getWeather = async (home_team_location) => {
        try {
            const dateObj = new Date(gameDate);
            const date = dateObj.toISOString().split("T")[0];
            const localHour = dateObj.getHours();
            const response = await axios.get(`${apiBaseUrl}/api/weather`, {
                params: { city: home_team_location, date: date }
            });

            const data = response.data.forecast.forecastday[0]
            const next_4_hours = getNext4HoursForecastByHour(data, localHour)
            setWeatherData(next_4_hours)
        } catch (error) { }
    }

    const populate = async () => {
        let home_team_location = homeTeam.split(" ")[0]
        if (homeTeam.split(" ").length > 2) {
            home_team_location = homeTeam.split(" ")[0] + homeTeam.split(" ")[1]
        }

        switch(home_team_location) {
            case "New England":
                home_team_location = "Foxborough"
                break
            case "Arizona":
                home_team_location = "Glendale"
                break
            case "Carolina":
                home_team_location = "Charlotte"
                break
            case "Minnesotta":
                home_team_location = "Minneapolis"
                break
            case "Tennessee":
                home_team_location = "Nashville"
                break
            case "New York":
                home_team_location = "East Rutherford"
                break
        }

        await getWeather(home_team_location)
    }

    return (
        <Dialog open={showStevenInfo} onClose={() => handleShowStevenInfo()} maxWidth="sm" fullWidth>
            <DialogContent dividers>
                <Row className="g-2">
                    {weatherData.map((hour) => {
                        const [hh, mm] = hour.time.split(" ")[1].split(":");
                        const hour12 = ((+hh + 11) % 12 + 1);
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
                        )
                    })}
                </Row>
            </DialogContent>
            <DialogActions>
                <StevenButton onClick={() => handleShowStevenInfo()}>
                    Close
                </StevenButton>
            </DialogActions>
        </Dialog>
    );
}

export default StevenGameInfo