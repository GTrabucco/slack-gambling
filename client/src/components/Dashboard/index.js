import React, { useEffect, useState } from "react";
import axios from 'axios';
import { Container, Row, Col, Table, Button, Accordion } from 'react-bootstrap';
import './style.css'
import { useAuth0 } from "@auth0/auth0-react";
import StevenNotification from "../StevenNotification";

const Dashboard = () => {
  const [games, setGames] = useState([]);
  const [selectedPicks, setSelectedPicks] = useState([])
  const [errors, setError] = useState("")
  const [message, setMessage] = useState("");
  const [messageVisible, setMessageVisible] = useState(false);
  const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
  const { user } = useAuth0();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/games`);
        setGames(response.data);
      } catch (error) {
        setError('Error fetching games');
      }
    };

    const fetchPicks = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/get-weekly-picks`, {
          params: {
            username: user.name
          }
        });

        if (response.data != null) {
          const picks = {};
          response.data.forEach(pick => {
            const pickIdentifier = `${pick.gameId}-${pick.type}`;
            picks[pickIdentifier] = pick.text;
          });

          setSelectedPicks(picks);
        }
      } catch (error) {
        setError('Error fetching picks');
      }
    };

    fetchGames();
    fetchPicks();
  }, [])

  const getCommenceTimeByGameId = (gameId) => {
    const obj = games.find(item => item["_id"] === gameId);
    return obj.commence_time
  }

  const submitPick = async (gameId, homeTeam, awayTeam, pickType, value, text) => {
    const pickIdentifier = `${gameId}-${pickType}`;
    const existingPick = Object.keys(selectedPicks).find(pickId => pickId.includes(`-${pickType}`));
    if (existingPick) {
      const existingPickGameId = existingPick.split('-')[0];
      const existingPickCommenceTime = getCommenceTimeByGameId(existingPickGameId)
      if (gameStarted(existingPickCommenceTime)) {
        setMessage(`You already selected a ${pickType} in a game that has started`)
        return;
      }

      setSelectedPicks(prevState => {
        const newState = { ...prevState };
        if (existingPick === pickIdentifier) {
          setMessage(`Removed ${newState[existingPick]}`)
          delete newState[existingPick];
        } else {
          if (existingPick) {
            setMessage(`Added ${text} Removed ${newState[existingPick]}`)
            delete newState[existingPick];
          }
          newState[pickIdentifier] = text;
        }
        return newState;
      });
    } else {
      setMessage(`Added ${text}`)
      setSelectedPicks(prevState => ({
        ...prevState,
        [pickIdentifier]: text,
      }));
    }

    try {
      const username = user.name;
      const data = { username, homeTeam, awayTeam, pickType, gameId, value, text }
      await axios.post(`${apiBaseUrl}/api/submit-picks`, data);
    } catch (error) {
      setError('Error submitting pick');
    }
  }

  const handleButtonClick = (gameId, homeTeam, awayTeam, pickType, value, text) => {
    submitPick(gameId, homeTeam, awayTeam, pickType, value, text);
  };

  const gameStarted = (commenceTime) => {
    const currentTime = new Date();
    const targetTime = new Date(commenceTime);
    return currentTime > targetTime
  }

  return (
    <Container>
      <Row>
        <StevenNotification
          message={message}
          setMessage={setMessage}
        />
      </Row>
      <hr></hr>
      <Row>
        <Col><b>Favorite Selected</b></Col>
        <Col><b>Underdog Selected</b></Col>
        <Col><b>Over Selected</b></Col>
        <Col><b>Under Selected</b></Col>
      </Row>
      <Row>
        <Col>
          {
            Object.keys(selectedPicks).some(key => key.endsWith('-favorite') && selectedPicks[key])
              ? <i className="bi bi-check-circle-fill" style={{ color: 'green', fontSize: '1.5rem' }}></i>
              : <i className="bi bi-x-circle-fill" style={{ color: 'red', fontSize: '1.5rem' }}></i>
          }
        </Col>
        <Col>
          {
            Object.keys(selectedPicks).some(key => key.endsWith('-dog') && selectedPicks[key])
              ? <i className="bi bi-check-circle-fill" style={{ color: 'green', fontSize: '1.5rem' }}></i>
              : <i className="bi bi-x-circle-fill" style={{ color: 'red', fontSize: '1.5rem' }}></i>
          }
        </Col>
        <Col>
          {
            Object.keys(selectedPicks).some(key => key.endsWith('-over') && selectedPicks[key])
              ? <i className="bi bi-check-circle-fill" style={{ color: 'green', fontSize: '1.5rem' }}></i>
              : <i className="bi bi-x-circle-fill" style={{ color: 'red', fontSize: '1.5rem' }}></i>
          }
        </Col>
        <Col>
          {
            Object.keys(selectedPicks).some(key => key.endsWith('-under') && selectedPicks[key])
              ? <i className="bi bi-check-circle-fill" style={{ color: 'green', fontSize: '1.5rem' }}></i>
              : <i className="bi bi-x-circle-fill" style={{ color: 'red', fontSize: '1.5rem' }}></i>
          }
        </Col>

      </Row>
      <hr />
      <Row>
        <Col>
          <Accordion defaultActiveKey="0" flush>
            {games
              .sort((a, b) => new Date(a["commence_time"]) - new Date(b["commence_time"]))
              .map((game) => {
                let home_team = game["home_team"];
                let away_team = game["away_team"];
                let home_spread = game["home_spread"]
                let away_spread = game["away_spread"]

                let home_team_name = home_team.split(" ").pop()
                let away_team_name = away_team.split(" ").pop()

                let home_logo = `logos/${home_team_name}.png`;
                let away_logo = `logos/${away_team_name}.png`;

                let over = game["over"]
                let under = game["under"]
                let commenceTime = game["commence_time"]
                let favorite = +home_spread > +away_spread ? away_team + " " + away_spread : home_team + " " + home_spread
                let underdog = +home_spread > +away_spread ? home_team + " +" + home_spread : away_team + " +" + away_spread
                let favorite_spread = +home_spread > +away_spread ? +away_spread : +home_spread
                let underdog_spread = +home_spread > +away_spread ? +home_spread : +away_spread

                let away_picked =
                  (selectedPicks[`${game["_id"]}-dog`] && selectedPicks[`${game["_id"]}-dog`].includes(away_team_name)) ||
                  (selectedPicks[`${game["_id"]}-favorite`] && selectedPicks[`${game["_id"]}-favorite`].includes(away_team_name));

                let home_picked =
                  (selectedPicks[`${game["_id"]}-dog`] && selectedPicks[`${game["_id"]}-dog`].includes(home_team_name)) ||
                  (selectedPicks[`${game["_id"]}-favorite`] && selectedPicks[`${game["_id"]}-favorite`].includes(home_team_name));

                let over_picked = selectedPicks[`${game["_id"]}-over`] ? true : false;
                let under_picked = selectedPicks[`${game["_id"]}-under`] ? true : false;

                let header = (
                  <>
                    <div className="team-container">
                      <img
                        src={away_logo}
                        alt={away_team}
                        className="logo"
                      />
                      {away_picked ?
                        <div><div className="team-name picked">{away_team}</div>
                          <b className="picked">{away_spread}</b></div> :
                        <div><div className="team-name">{away_team}</div><b>{away_spread}</b></div>
                      }
                    </div>
                    <div className="team-container">
                      <img
                        src={home_logo}
                        alt={home_team}
                        className="logo"
                      />
                      {home_picked ?
                        <div><div className="team-name picked">{home_team}</div>
                          <b className="picked">{home_spread}</b></div> :
                        <div><div className="team-name">{home_team}</div><b>{home_spread}</b></div>
                      }
                    </div>
                    <div className="icon-text-container">
                      {over_picked ? (
                        <span className="picked">
                          <i className="bi bi-arrow-up-square-fill"></i>
                        </span>
                      ) : (
                        <i className="bi bi-arrow-up-square-fill"></i>
                      )}
                      <div className="over-text">
                        <b>{over}</b>
                      </div>
                      {under_picked ? (
                        <span className="picked">
                          <i className="bi bi-arrow-down-square-fill"></i>
                        </span>
                      ) : (
                        <i className="bi bi-arrow-down-square-fill"></i>
                      )}
                    </div>
                  </>
                );

                return (
                  <Accordion.Item eventKey={game["_id"]} >
                    <Accordion.Header>{header}</Accordion.Header>
                    <Accordion.Body>
                      <Table>
                        <tbody>
                          <tr key={game["_id"]}>
                            <td>{new Date(commenceTime).toLocaleString()}</td>
                            <td><Button disabled={gameStarted(commenceTime)} className={`bet-btn ${selectedPicks[`${game["_id"]}-favorite`] ? 'selected' : ''}`} onClick={() => handleButtonClick(game["_id"], home_team, away_team, "favorite", favorite_spread, favorite)}>{favorite}</Button></td>
                            <td><Button disabled={gameStarted(commenceTime)} className={`bet-btn ${selectedPicks[`${game["_id"]}-dog`] ? 'selected' : ''}`} onClick={() => handleButtonClick(game["_id"], home_team, away_team, "dog", underdog_spread, underdog)}>{underdog}</Button></td>
                            <td><Button disabled={gameStarted(commenceTime)} className={`bet-btn ${selectedPicks[`${game["_id"]}-over`] ? 'selected' : ''}`} onClick={() => handleButtonClick(game["_id"], home_team, away_team, "over", over, `${home_team} ${away_team} Over ${over}`)}>Over {over}</Button></td>
                            <td><Button disabled={gameStarted(commenceTime)} className={`bet-btn ${selectedPicks[`${game["_id"]}-under`] ? 'selected' : ''}`} onClick={() => handleButtonClick(game["_id"], home_team, away_team, "under", under, `${home_team} ${away_team} Under ${under}`)}>Under {under}</Button></td>
                          </tr>
                        </tbody>
                      </Table>
                    </Accordion.Body>
                  </Accordion.Item>
                );
              })}
          </Accordion>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;