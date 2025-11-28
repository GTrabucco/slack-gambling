import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from 'axios'
import './style.css'
import {  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography, } from "@mui/material";

const TeamsBet = () => {
  const [error, setError] = useState("");
  const { user } = useAuth0();
  const [teamCounts, setTeamCounts] = useState([])
  const [teamRecords, setTeamRecords] = useState([])
  const apiBaseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
  const TEAM_NAMES = [
    "Arizona Cardinals",
    "Atlanta Falcons",
    "Baltimore Ravens",
    "Buffalo Bills",
    "Carolina Panthers",
    "Chicago Bears",
    "Cincinnati Bengals",
    "Cleveland Browns",
    "Dallas Cowboys",
    "Denver Broncos",
    "Detroit Lions",
    "Green Bay Packers",
    "Houston Texans",
    "Indianapolis Colts",
    "Jacksonville Jaguars",
    "Kansas City Chiefs",
    "Las Vegas Raiders",
    "Los Angeles Chargers",
    "Los Angeles Rams",
    "Miami Dolphins",
    "Minnesota Vikings",
    "New England Patriots",
    "New Orleans Saints",
    "New York Giants",
    "New York Jets",
    "Philadelphia Eagles",
    "Pittsburgh Steelers",
    "San Francisco 49ers",
    "Seattle Seahawks",
    "Tampa Bay Buccaneers",
    "Tennessee Titans",
    "Washington Commanders"
  ];

  useEffect(() => {
    const fetchPickHistory = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/get-pick-history`, {
          params: {
            username: user.name
          }
        });

        if (response.data != null) {
          const teamCounts = {};
          const teamRecords = {};
          for (const bet of response.data) {
            const { type, text, result } = bet;
            if (type === "favorite" || type === "underdog") {
              const parts = text.trim().split(" ");
              const teamName = parts.slice(0, parts.length - 1).join(" ");
              teamCounts[teamName] = (teamCounts[teamName] || 0) + 1;
              teamRecords[teamName] = teamRecords[teamName] || { wins: 0, losses: 0, pushes: 0 };
              if (result === 1) {
                teamRecords[teamName].wins += 1;
              } else if (result === -1) {
                teamRecords[teamName].losses += 1;
              } else if (result === 0) {
                teamRecords[teamName].pushes += 1;
              }
            } else if (type === "over" || type === "under") {
              const parts = text.trim().split(" ");
              const spread = parts.pop();
              const betTypeWord = parts.pop();
              if (parts.length === 4) {
                const team1 = parts.slice(0, 2).join(" ");
                const team2 = parts.slice(2).join(" ");
                teamCounts[team1] = (teamCounts[team1] || 0) + 1;
                teamCounts[team2] = (teamCounts[team2] || 0) + 1;
                teamRecords[team1] = teamRecords[team1] || { wins: 0, losses: 0, pushes: 0 };
                if (result === 1) {
                  teamRecords[team1].wins += 1;
                } else if (result === -1) {
                  teamRecords[team1].losses += 1;
                } else if (result === 0) {
                  teamRecords[team1].pushes += 1;
                }
                teamRecords[team2] = teamRecords[team2] || { wins: 0, losses: 0, pushes: 0 };
                if (result === 1) {
                  teamRecords[team2].wins += 1;
                } else if (result === -1) {
                  teamRecords[team2].losses += 1;
                } else if (result === 0) {
                  teamRecords[team2].pushes += 1;
                }
              } else if (parts.length === 6) {
                const team1 = parts.slice(0, 3).join(" ");
                const team2 = parts.slice(3).join(" ");
                teamCounts[team1] = (teamCounts[team1] || 0) + 1;
                teamCounts[team2] = (teamCounts[team2] || 0) + 1;
                teamRecords[team1] = teamRecords[team1] || { wins: 0, losses: 0, pushes: 0 };
                if (result === 1) {
                  teamRecords[team1].wins += 1;
                } else if (result === -1) {
                  teamRecords[team1].losses += 1;
                } else if (result === 0) {
                  teamRecords[team1].pushes += 1;
                }
                teamRecords[team2] = teamRecords[team2] || { wins: 0, losses: 0, pushes: 0 };
                if (result === 1) {
                  teamRecords[team2].wins += 1;
                } else if (result === -1) {
                  teamRecords[team2].losses += 1;
                } else if (result === 0) {
                  teamRecords[team2].pushes += 1;
                }
              } else {
                const team1_try = parts.slice(0, 2).join(" ");
                if (TEAM_NAMES.includes(team1_try)) {
                  const team1 = team1_try;
                  const team2 = parts.slice(2).join(" ");
                  teamCounts[team1] = (teamCounts[team1] || 0) + 1;
                  teamCounts[team2] = (teamCounts[team2] || 0) + 1;
                  teamRecords[team1] = teamRecords[team1] || { wins: 0, losses: 0, pushes: 0 };
                  if (result === 1) {
                    teamRecords[team1].wins += 1;
                  } else if (result === -1) {
                    teamRecords[team1].losses += 1;
                  } else if (result === 0) {
                    teamRecords[team1].pushes += 1;
                  }
                  teamRecords[team2] = teamRecords[team2] || { wins: 0, losses: 0, pushes: 0 };
                  if (result === 1) {
                    teamRecords[team2].wins += 1;
                  } else if (result === -1) {
                    teamRecords[team2].losses += 1;
                  } else if (result === 0) {
                    teamRecords[team2].pushes += 1;
                  }
                } else {
                  const team1 = parts.slice(0, 3).join(" ");
                  const team2 = parts.slice(3).join(" ");
                  teamCounts[team1] = (teamCounts[team1] || 0) + 1;
                  teamCounts[team2] = (teamCounts[team2] || 0) + 1;
                  teamRecords[team1] = teamRecords[team1] || { wins: 0, losses: 0, pushes: 0 };
                  if (result === 1) {
                    teamRecords[team1].wins += 1;
                  } else if (result === -1) {
                    teamRecords[team1].losses += 1;
                  } else if (result === 0) {
                    teamRecords[team1].pushes += 1;
                  }
                  teamRecords[team2] = teamRecords[team2] || { wins: 0, losses: 0, pushes: 0 };
                  if (result === 1) {
                    teamRecords[team2].wins += 1;
                  } else if (result === -1) {
                    teamRecords[team2].losses += 1;
                  } else if (result === 0) {
                    teamRecords[team2].pushes += 1;
                  }
                }
              }
            }
          }

          setTeamCounts(teamCounts);
          setTeamRecords(teamRecords);
        }
      } catch (error) {
        setError('Error fetching picks');
      }
    };

    fetchPickHistory();
  }, [])

  const sortedTeams = Object.entries(teamCounts).sort((a, b) => b[1] - a[1]);

  return (
    <TableContainer component={Paper} sx={{ maxWidth: 500, margin: "auto", mt: 3 }}>
      <Typography variant="h5" sx={{ p: 2, fontWeight: "bold" }}>
        Team Bet History
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Team</TableCell>
            <TableCell sx={{ fontWeight: "bold" }} align="right">
              Count
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }} align="right">
              Record
            </TableCell>
            <TableCell sx={{ fontWeight: "bold" }} align="right">
              Pct
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {sortedTeams.map(([team, count]) => (
            <TableRow key={team}>
              <TableCell>{team}</TableCell>
              <TableCell align="right">{count}</TableCell>
              <TableCell align="right">
                {teamRecords[team] ? `${teamRecords[team].wins}-${teamRecords[team].losses}-${teamRecords[team].pushes}` : "0-0-0"}
              </TableCell>
              <TableCell align="right">
                {teamRecords[team] ? ((teamRecords[team].wins / (teamRecords[team].wins + teamRecords[team].losses)) * 100).toFixed(1) + "%" : "0.0%"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TeamsBet;
