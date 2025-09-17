import { useEffect, useState } from "react";
import axios from 'axios';
import { Row, Col, Form } from 'react-bootstrap';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import './style.css'
import { useAuth0 } from "@auth0/auth0-react";
import StevenNotification from "../StevenNotification";
import { FaTrash } from 'react-icons/fa';
import StevenButton from "../Common/StevenButton";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import StevenGameInfo from "../StevenGameInfo";

const Dashboard = () => {
  const [games, setGames] = useState([]);
  const [selectedPicks, setSelectedPicks] = useState([])
  const [tempPicks, setTempPicks] = useState([])
  const [errors, setError] = useState("")
  const [showVenmo, setShowVenmo] = useState(false)
  const [message, setMessage] = useState("");
  const [selectedGameId, setSelectedGameId] = useState()
  const [showStevenInfo, setShowStevenInfo] = useState(false)
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

  const updateHasPaid = async (e) => {
    try {
        const username = user.name;
        await axios.post(`${apiBaseUrl}/api/has-paid`, {
            username: username
        });
    } catch (error) {
        setMessage('Error updating user details has paid');
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
        setSelectedPicks(response.data);
        setTempPicks(response.data);
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
    const { gameId, homeTeam, awayTeam, type, value, text } = data;
    try {
      const username = user.name;
      const data = { username, homeTeam, awayTeam, type, gameId, value, text }
      await axios.post(`${apiBaseUrl}/api/submit-picks`, data);
    } catch (error) {
      setError('Error submitting pick');
    }
  }

  const removePick = async (pickIdentifier, text) => {
    const existingPickGameId = pickIdentifier.split('-')[0];
    const commenceTime = getCommenceTimeByGameId(existingPickGameId)
    if (gameStarted(commenceTime)) {
      setMessage("Can't Remove. Game Already Started")
      return;
    }

    try {
      const gameId = pickIdentifier.split('-')[0]
      const pickType = pickIdentifier.split('-')[1]
      const username = user.name;
      const data = { username, gameId, pickType, text }
      await axios.post(`${apiBaseUrl}/api/remove-pick`, data);
      setSelectedPicks(prevState => {
        const newState = prevState.filter(
          pick => !(pick.gameId === gameId && pick.type === pickType)
        );

        if (newState.length !== prevState.length) {
          const removedPick = prevState.find(
            pick => pick.gameId === gameId && pick.type === pickType
          );
          setMessage(`Removed ${removedPick.text}`);
          setTempPicks(tempPrev =>
            tempPrev.filter(pick => !(pick.gameId === gameId && pick.type === pickType))
          );
        } else {
          setMessage("Nothing to remove");
        }

        return newState;
      });
    } catch (error) {
      setError('Error submitting pick');
    }
  }

  const submitPicks = async (e) => {
    e.preventDefault();
    const additions = Object.entries(tempPicks).filter(
      ([key, value]) => !selectedPicks.hasOwnProperty(key) || selectedPicks[key] !== value
    );
    for (let pick in additions) {
      await submitPick(additions[pick][1])
    }

    await fetchPicks();
    setMessage("Successfully Submitted Picks")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const isOpposite = (type) => {
    switch(type) {
      case "dog":
        return "favorite"
      case "favorite":
        return "dog"
      case "over":
        return "under"
      case "under":
        return "over"
      default:
        return false
    }
  }

  const updatePick = (gameId, homeTeam, awayTeam, type, value, text, commenceTime) => {
    if (gameStarted(commenceTime)) {
      setMessage("Game Already Started");
      return;
    }

    const existingPick = tempPicks.find(pick => pick.type === type);
    if (existingPick) {
      const existingPickCommenceTime = getCommenceTimeByGameId(existingPick.gameId);
      if (gameStarted(existingPickCommenceTime)) {
        setMessage(`You already selected a ${type} in a game that has started`);
        return;
      }
    }

    const oppositePick = tempPicks.find(pick => pick.type === isOpposite(type) && pick.gameId === gameId)
    if (oppositePick) {
      setTempPicks(prevState => {
        const oppositeIndex = prevState.findIndex(
          pick => pick.type === isOpposite(type) && pick.gameId === gameId
        );

        if (oppositeIndex !== -1 && prevState[oppositeIndex].gameId === gameId) {
          const newState = [...prevState];
          newState.splice(oppositeIndex, 1);
          return newState;
        }

        if (oppositeIndex !== -1) {
          const newState = [...prevState];
          newState[oppositeIndex] = { gameId, homeTeam, awayTeam, type, value, text };
          return newState;
        }

        return [...prevState, { gameId, homeTeam, awayTeam, type, value, text }];
      });
    }

    setTempPicks(prevState => {
      const existingIndex = prevState.findIndex(
        pick => pick.type === type
      );

      if (existingIndex !== -1 && prevState[existingIndex].gameId === gameId) {
        const newState = [...prevState];
        newState.splice(existingIndex, 1);
        return newState;
      }

      if (existingIndex !== -1) {
        const newState = [...prevState];
        newState[existingIndex] = { gameId, homeTeam, awayTeam, type, value, text };
        return newState;
      }

      return [...prevState, { gameId, homeTeam, awayTeam, type, value, text }];
    });
  };

  const gameStarted = (commenceTime) => {
    const currentTime = new Date();
    const targetTime = new Date(commenceTime);
    return currentTime > targetTime
  }

  const handleCloseVenmo = async (status) => {
    if (status) {
      await updateHasPaid()
    }
    
    setShowVenmo(false);
  };

  return (
    <div className="dashboard-container">
      <Row>
        <StevenNotification
          message={message}
          setMessage={setMessage}
        />
      </Row>
      <br />
      <Dialog open={showVenmo} onClose={() => handleCloseVenmo()} maxWidth="sm" fullWidth>
        <DialogTitle>
            $105 Buy In Must Be Paid Before Start of Week 1 Games
        </DialogTitle>
        <DialogContent dividers>
            <Typography gutterBottom>
              <a
                href="https://venmo.com/u/Giulian-Trabucco?txn=pay&amount=105&note=Slack Pool"
                style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "inherit" }}
              >
                <img className="medal" src="venmo.png" alt="Venmo" />
                <span>Venmo</span>
              </a>
            </Typography>
            <br/>
            <Typography gutterBottom>
              <a
                href="https://cash.app/$GiulianTrabucco/105"
                style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "inherit" }}
              >
                <img className="medal" src="cashapp.webp" alt="Cash App" />
                <span>Cash App</span>
              </a>
            </Typography>
        </DialogContent>
        <DialogActions>
            <StevenButton onClick={()=>handleCloseVenmo(true)}>
                I have paid the buy in
            </StevenButton>
            <StevenButton onClick={()=>handleCloseVenmo(false)}>
                I plan on paying soon
            </StevenButton>
        </DialogActions>
      </Dialog>
      <StevenGameInfo 
        showStevenInfo={showStevenInfo} 
        selectedGameId={selectedGameId} 
        setShowStevenInfo={setShowStevenInfo}
      />
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <TableContainer component={Paper} elevation={5}>
          <Table>
            <TableBody>
              {['favorite', 'dog', 'over', 'under'].map((type) => {
                const pick = Array.isArray(selectedPicks) 
                  ? selectedPicks.find(obj => obj.type === type) 
                  : null;
                var key = null;
                var value = "-";
                if (pick) {
                  value = pick.text;
                  key = pick.gameId + "-" + type
                }
                return (
                  <TableRow key={type}>
                    <TableCell>
                      <b>{type.charAt(0).toUpperCase() + type.slice(1)}</b>
                    </TableCell>
                    <TableCell>
                      {value}
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      {value && (
                        <span
                          onClick={() => removePick(key, value)}
                          style={{
                            cursor: 'pointer',
                            color: 'grey',
                            display: 'inline-flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                          }}
                          aria-label={`Remove ${type} pick`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') removePick(key, value);
                          }}
                        >
                          <FaTrash />
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <hr />
      <Row className="justify-content-md-center">
        <Form onSubmit={(e) => submitPicks(e)}>
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
              const away_picked = Array.isArray(tempPicks) 
                  ? tempPicks.find(obj => obj.type === "dog" && obj.text.includes(away_team_name)) ||  
                    tempPicks.find(obj => obj.type === "favorite" && obj.text.includes(away_team_name))
                  : null;
              const home_picked = Array.isArray(tempPicks) 
                  ? tempPicks.find(obj => obj.type === "dog" && obj.text.includes(home_team_name)) ||  
                    tempPicks.find(obj => obj.type === "favorite" && obj.text.includes(home_team_name))
                  : null;
              const over_picked = Array.isArray(tempPicks) 
                  ? tempPicks.find(obj => obj.type === "over" && obj.gameId === game["_id"])
                  : null;
              const under_picked = Array.isArray(tempPicks) 
                  ? tempPicks.find(obj => obj.type === "under" && obj.gameId === game["_id"])
                  : null;
              const dateObj = new Date(commenceTime);
              let header = (
                <Paper style={{ marginBottom: 20 }} elevation={2}>
                  <Row>
                    <Col style={{marginTop: 10, marginBottom: 10}}>
                      <b style={{ marginLeft: 10 }}>
                        {
                          `${dateObj.toLocaleDateString('en-US', { weekday: 'short' })}, ${dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                        }
                      </b>
                    </Col>
                    <Col style={{marginTop: 10, marginBottom: 10}}>
                      <span
                        onClick={()=>{ 
                          setShowStevenInfo(true)
                          setSelectedGameId(game["gameId"])
                        }}
                        style={{
                          marginLeft: 10,
                          fontSize: "0.85rem",
                          textDecoration: "underline",
                          cursor: "pointer",
                          color: "#6c757d"
                        }}
                      >
                        Weather Info
                      </span>
                    </Col>
                  </Row>
                  <div className="d-flex justify-content-center align-items-center text-center w-100">
                    <div className={`team-container ${away_picked ? "picked" : ""}`} onClick={() =>
                        updatePick(
                          game["_id"],
                          home_team,
                          away_team,
                          away_spread > 0 ? "dog" : "favorite",
                          away_spread > 0 ? underdog_spread : favorite_spread,
                          away_spread > 0 ? underdog : favorite,
                          commenceTime
                        )
                      }>
                      <img
                        src={away_logo}
                        alt={away_team}
                        className="logo"
                      />
                      <div><div className="team-name">{away_team}</div><b>{away_spread > 0 ? "+" + away_spread : away_spread}</b></div>
                    </div>
                    <div className={`team-container ${home_picked ? "picked" : ""}`} onClick={() =>
                      updatePick(
                        game["_id"],
                        home_team,
                        away_team,
                        away_spread > 0 ? "favorite" : "dog",
                        away_spread > 0 ? favorite_spread : underdog_spread,
                        away_spread > 0 ? favorite : underdog,
                        commenceTime
                      )
                    }>
                      <img
                        src={home_logo}
                        alt={home_team}
                        className="logo"
                      />
                      <div><div className="team-name">{home_team}</div><b>{home_spread > 0 ? "+" + home_spread : home_spread}</b></div>
                    </div>
                    <div className="icon-text-container">
                      {over_picked ? (
                        <span className="total-picked">
                          <h2 className="bi bi-arrow-up-square-fill" onClick={() =>
                            updatePick(
                              game["_id"],
                              home_team,
                              away_team,
                              "over",
                              over,
                              `${home_team} ${away_team} Over ${over}`,
                              commenceTime
                            )
                          }></h2>
                        </span>
                      ) : (
                        <h2 className="total bi bi-arrow-up-square-fill" onClick={() =>
                          updatePick(
                            game["_id"],
                            home_team,
                            away_team,
                            "over",
                            over,
                            `${home_team} ${away_team} Over ${over}`,
                            commenceTime
                          )
                        }></h2>
                      )}
                      <div className="over-text">
                        <b>{over}</b>
                      </div>
                      {under_picked ? (
                        <span className="total-picked">
                          <h2 className="bi bi-arrow-down-square-fill" onClick={() =>
                            updatePick(
                              game["_id"],
                              home_team,
                              away_team,
                              "under",
                              under,
                              `${home_team} ${away_team} Under ${under}`,
                              commenceTime
                            )
                          }></h2>
                        </span>
                      ) : (
                        <h2 className="total bi bi-arrow-down-square-fill" onClick={() =>
                          updatePick(
                            game["_id"],
                            home_team,
                            away_team,
                            "under",
                            under,
                            `${home_team} ${away_team} Under ${under}`,
                            commenceTime
                          )
                        }></h2>
                      )}
                    </div>
                  </div>
                </Paper>
              );

              return header;
            })}
          <Row className="mt-5">
            <Col xs={12} md={{ span: 3, offset: 9 }} className="text-md-end text-center">
              <StevenButton className="w-100" type="submit">
                Submit
              </StevenButton>
            </Col>
          </Row>
          <br />
        </Form>
      </Row>
    </div>
  );
};

export default Dashboard;