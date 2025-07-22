import React, { useEffect, useState } from "react";
import axios from 'axios';
import { Row, Col, Table, Button, Accordion, Form, Card } from 'react-bootstrap';
import './style.css'
import { useAuth0 } from "@auth0/auth0-react";
import StevenNotification from "../StevenNotification";

const Dashboard = () => {
  const [games, setGames] = useState([]);
  const [selectedPicks, setSelectedPicks] = useState([])
  const [activeKey, setActiveKey] = useState(null)
  const [tempPicks, setTempPicks] = useState([])
  const [errors, setError] = useState("")
  const [submitButtonText, setSubmitButtonText] = useState("Submit");
  const [message, setMessage] = useState("");
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

    fetchGames();
    fetchPicks();
  }, [])

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

  const getCommenceTimeByGameId = (gameId) => {
    const obj = games.find(item => item["_id"] === gameId);
    return obj.commence_time
  }

  const submitPick = async (data) => {
    const { gameId, homeTeam, awayTeam, pickType, value, text } = data;
    try {
      const username = user.name;
      const data = { username, homeTeam, awayTeam, pickType, gameId, value, text }
      await axios.post(`${apiBaseUrl}/api/submit-picks`, data);
    } catch (error) {
      setError('Error submitting pick');
    }
  }

  const removePick = async (pickIdentifier, text) => {
    try {
      const gameId = pickIdentifier.split('-')[0]
      const pickType = pickIdentifier.split('-')[1]
      const username = user.name;
      const data = { username, gameId, pickType, text }
      await axios.post(`${apiBaseUrl}/api/remove-pick`, data);

      setSelectedPicks(prevState => {
        const newState = { ...prevState };
        setMessage(`Removed ${newState[pickIdentifier]}`)
        delete newState[pickIdentifier];
        return newState;
      });

    } catch (error) {
      setError('Error submitting pick');
    }
  }

  const submitPicks = async (e) => {
    e.preventDefault();
    // removals
    const removals = Object.entries(selectedPicks).filter(
      ([key, value]) => {
        return tempPicks.hasOwnProperty(key.split('-')[1]) || tempPicks[key] === value
      }
    );

    // additions
    const additions = Object.entries(tempPicks).filter(
      ([key, value]) => !selectedPicks.hasOwnProperty(key) || selectedPicks[key] !== value
    );
    for (let pick in additions) {
      await submitPick(additions[pick][1])
    }

    for (let pick in removals) {
      await removePick(removals[pick][0], removals[pick][1])
    }

    await fetchPicks();
    setTempPicks([])
    setActiveKey(null)
    setMessage("Successfully Submitted Picks")
  }

  const updatePick = (gameId, homeTeam, awayTeam, pickType, value, text) => {
    const pickIdentifier = `${gameId}-${pickType}`;
    const existingPick = Object.keys(tempPicks).find(pickId => pickId.includes(`-${pickType}`));
    if (existingPick) {
      const existingPickGameId = existingPick.split('-')[0];
      const existingPickCommenceTime = getCommenceTimeByGameId(existingPickGameId)
      if (gameStarted(existingPickCommenceTime)) {
        setMessage(`You already selected a ${pickType} in a game that has started`)
        return;
      }

      setTempPicks(prevState => {
        const newState = { ...prevState };
        if (existingPick === pickIdentifier) {
          delete newState[existingPick];
        } else {
          if (existingPick) {
            delete newState[existingPick];
          }
          newState[pickIdentifier] = { gameId, homeTeam, awayTeam, pickType, value, text };
        }
        return newState;
      });
    } else {
      setTempPicks(prevState => ({
        ...prevState,
        [pickIdentifier]: { gameId, homeTeam, awayTeam, pickType, value, text },
      }));
    }
  }

  const gameStarted = (commenceTime) => {
    const currentTime = new Date();
    const targetTime = new Date(commenceTime);
    return currentTime > targetTime
  }

  return (
    <div className="dashboard-container">
      <Row>
        <StevenNotification
          message={message}
          setMessage={setMessage}
        />
      </Row>
      <br />
      <hr></hr>
      <Row>
        <Col><b>Favorite</b></Col>
        <Col><b>Underdog</b></Col>
        <Col><b>Over</b></Col>
        <Col><b>Under</b></Col>
      </Row>
      <Row>
        <Col>
          {<div className="team-name">{selectedPicks[Object.keys(selectedPicks).find(key => key.endsWith('-favorite'))]}</div>}
        </Col>
        <Col>
          {<div className="team-name">{selectedPicks[Object.keys(selectedPicks).find(key => key.endsWith('-dog'))]}</div>}
        </Col>
        <Col>
          {<div className="team-name">{selectedPicks[Object.keys(selectedPicks).find(key => key.endsWith('-over'))]}</div>}
        </Col>
        <Col>
          {<div className="team-name">{selectedPicks[Object.keys(selectedPicks).find(key => key.endsWith('-under'))]}</div>}
        </Col>

      </Row>
      <hr />
      <Row className="justify-content-md-center">
        <Col>
          <Form onSubmit={(e) => submitPicks(e)}>
            <Accordion activeKey={activeKey} onSelect={setActiveKey} flush>
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
                    (tempPicks[`${game["_id"]}-dog`] && tempPicks[`${game["_id"]}-dog`].text.includes(away_team_name)) ||
                    (tempPicks[`${game["_id"]}-favorite`] && tempPicks[`${game["_id"]}-favorite`].text.includes(away_team_name));
                  let home_picked =
                    (tempPicks[`${game["_id"]}-dog`] && tempPicks[`${game["_id"]}-dog`].text.includes(home_team_name)) ||
                    (tempPicks[`${game["_id"]}-favorite`] && tempPicks[`${game["_id"]}-favorite`].text.includes(home_team_name));
                  let over_picked = tempPicks[`${game["_id"]}-over`] ? true : false;
                  let under_picked = tempPicks[`${game["_id"]}-under`] ? true : false;

                  let header = (
                    <>
                      <div className="d-flex justify-content-center align-items-center text-center w-100">
                        <div className="team-container">
                          <img
                            src={away_logo}
                            alt={away_team}
                            className="logo"
                          />
                          {away_picked ?
                            <div><div className="team-name picked">{away_team}</div>
                              <b className="picked">{away_spread > 0 ? "+" + away_spread : away_spread}</b></div> :
                            <div><div className="team-name">{away_team}</div><b>{away_spread > 0 ? "+" + away_spread : away_spread}</b></div>
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
                              <b className="picked">{home_spread > 0 ? "+" + home_spread : home_spread}</b></div> :
                            <div><div className="team-name">{home_team}</div><b>{home_spread > 0 ? "+" + home_spread : home_spread}</b></div>
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
                      </div>
                    </>
                  );

                  return (
                    <Accordion.Item eventKey={game["_id"]} key={game["_id"]}>
                      <Accordion.Header>{header}</Accordion.Header>
                      <Accordion.Body>
                        <div className="text-center mb-2">
                          <b>{new Date(commenceTime).toLocaleString()}</b>
                        </div>                        <Row className="g-2 mt-2">
                          {(home_spread < 0 ? (
                            <>
                              <Col xs={12} sm={6} md={3}>
                                <Button
                                  className="dashboard-btn w-100"
                                  disabled={gameStarted(commenceTime)}
                                  onClick={() =>
                                    updatePick(
                                      game["_id"],
                                      home_team,
                                      away_team,
                                      "dog",
                                      underdog_spread,
                                      underdog
                                    )
                                  }
                                >
                                  {underdog}
                                </Button>
                              </Col>
                              <Col xs={12} sm={6} md={3}>
                                <Button
                                  className="dashboard-btn w-100"
                                  disabled={gameStarted(commenceTime)}
                                  onClick={() =>
                                    updatePick(
                                      game["_id"],
                                      home_team,
                                      away_team,
                                      "favorite",
                                      favorite_spread,
                                      favorite
                                    )
                                  }
                                >
                                  {favorite}
                                </Button>
                              </Col>
                            </>
                          ) : (
                            <>
                              <Col xs={12} sm={6} md={3}>
                                <Button
                                  className="dashboard-btn w-100"
                                  disabled={gameStarted(commenceTime)}
                                  onClick={() =>
                                    updatePick(
                                      game["_id"],
                                      home_team,
                                      away_team,
                                      "favorite",
                                      favorite_spread,
                                      favorite
                                    )
                                  }
                                >
                                  {favorite}
                                </Button>
                              </Col>
                              <Col xs={12} sm={6} md={3}>
                                <Button
                                  className="dashboard-btn w-100"
                                  disabled={gameStarted(commenceTime)}
                                  onClick={() =>
                                    updatePick(
                                      game["_id"],
                                      home_team,
                                      away_team,
                                      "dog",
                                      underdog_spread,
                                      underdog
                                    )
                                  }
                                >
                                  {underdog}
                                </Button>
                              </Col>
                            </>
                          ))}
                          <Col xs={12} sm={6} md={3}>
                            <Button
                              className="dashboard-btn w-100"
                              disabled={gameStarted(commenceTime)}
                              onClick={() =>
                                updatePick(
                                  game["_id"],
                                  home_team,
                                  away_team,
                                  "over",
                                  over,
                                  `${home_team} ${away_team} Over ${over}`
                                )
                              }
                            >
                              <span>Over {over}</span>
                            </Button>
                          </Col>
                          <Col xs={12} sm={6} md={3}>
                            <Button
                              className="dashboard-btn w-100"
                              disabled={gameStarted(commenceTime)}
                              onClick={() =>
                                updatePick(
                                  game["_id"],
                                  home_team,
                                  away_team,
                                  "under",
                                  under,
                                  `${home_team} ${away_team} Under ${under}`
                                )
                              }
                            >
                              <span>Under {under}</span>
                            </Button>
                          </Col>
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>
                  );
                })}
            </Accordion>
            <Row className="mt-5">
              <Col xs={12} md={{ span: 3, offset: 9 }} className="text-md-end text-center">
                <Button className="dashboard-btn" type="submit">
                  {submitButtonText}
                </Button>
              </Col>
            </Row>
            <br/>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;