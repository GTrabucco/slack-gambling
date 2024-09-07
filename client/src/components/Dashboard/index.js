import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/AuthProvider";
import axios from 'axios';
import { Container, Row, Col, Table, Button } from 'react-bootstrap';
import './style.css'
const Dashboard = () => {
  var auth = useAuth();
  const [games, setGames]=useState([]);
  const [selectedPicks, setSelectedPicks]=useState([])
  const [errors, setError]=useState("")

  useEffect(()=>{
    const fetchGames = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/games');
          setGames(response.data);
        } catch (error) {
            setError('Error fetching games');
        }
    };

    const fetchPicks = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/get-weekly-picks', {
          params: {
            username: auth.user?.username
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

  const submitPick = async (gameId, pickType, value) => {
    const pickIdentifier = `${gameId}-${pickType}`;
    const existingPick = Object.keys(selectedPicks).find(pickId => pickId.includes(`-${pickType}`));
    if (existingPick) {
      const existingPickGameId = existingPick.split('-')[0];
      const existingPickCommenceTime = getCommenceTimeByGameId(existingPickGameId)
      if (gameStarted(existingPickCommenceTime)) {
        return;
      }

      setSelectedPicks(prevState => {
        const newState = { ...prevState };
        if (existingPick === pickIdentifier) {
          delete newState[existingPick];
        } else {
          if (existingPick) {
            delete newState[existingPick];
          }
          newState[pickIdentifier] = value;
        }        
        return newState;
      });
    } else {
      setSelectedPicks(prevState => ({
        ...prevState,
        [pickIdentifier]: value,
      }));
    }

    try {
      const username = auth.user?.username;
      const data = {username, pickType, gameId, value}
      await axios.post('http://localhost:5000/api/submit-picks', data);
    } catch (error) {
      setError('Error submitting pick');
    }
  }

  const handleButtonClick = (gameId, pickType, value) => {
    submitPick(gameId, pickType, value);
  };

  const gameStarted = (commenceTime) => {
    const currentTime = new Date();
    const targetTime = new Date(commenceTime);
    return currentTime > targetTime
  }

  return (
    <Container>
        <Row>
          <Col>
            <Table>
              <tbody>
                {games
                  .sort((a, b) => new Date(a["commence_time"]) - new Date(b["commence_time"]))
                  .map((game) => {
                    let home_team = game["home_team"];
                    let away_team = game["away_team"];
                    let home_spread = game["home_spread"];
                    let away_spread = game["away_spread"]
                    let over = game["over"]
                    let under = game["under"]
                    let commenceTime = game["commence_time"]
                    let favorite = +home_spread > +away_spread ? away_team + " " + away_spread : home_team + " " + home_spread
                    let underdog = +home_spread > +away_spread ? home_team + " +" + home_spread : away_team + " +" + away_spread
                    return (
                      <tr key={game["_id"]}>
                        <td>{new Date(commenceTime).toLocaleString()}</td>
                        <td><Button disabled={gameStarted(commenceTime)} className={`bet-btn ${selectedPicks[`${game["_id"]}-favorite`] ? 'selected' : ''}`} onClick={()=>handleButtonClick(game["_id"], "favorite", favorite)}>{favorite}</Button></td>
                        <td><Button disabled={gameStarted(commenceTime)} className={`bet-btn ${selectedPicks[`${game["_id"]}-dog`] ? 'selected' : ''}`} onClick={()=>handleButtonClick(game["_id"], "dog", underdog)}>{underdog}</Button></td>
                        <td><Button disabled={gameStarted(commenceTime)} className={`bet-btn ${selectedPicks[`${game["_id"]}-over`] ? 'selected' : ''}`} onClick={()=>handleButtonClick(game["_id"], "over",  `${home_team} ${away_team} Over ${over}`)}>Over {over}</Button></td>
                        <td><Button disabled={gameStarted(commenceTime)} className={`bet-btn ${selectedPicks[`${game["_id"]}-under`] ? 'selected' : ''}`} onClick={()=>handleButtonClick(game["_id"], "under", `${home_team} ${away_team} Under ${under}`)}>Under {under}</Button></td>
                      </tr>
                    );
                })}
              </tbody>
            </Table>       
          </Col>
        </Row>
    </Container>       
  );
};

export default Dashboard;